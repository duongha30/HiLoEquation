'use strict';
import { addSymbolIfNotExists, createDeck, drawOnlyNumber, drawCard, shuffleDeck } from './deck.ts';
import type {
    CardData,
    GameState,
    HandsType,
} from './types.ts';
import { INIT_CASH, INIT_SCORE, INIT_BETTING, DEFAULT_OPERATION_CARDS } from './constant.ts';
import redisClient from '../dbs/init.redis';
import type { IGameCore } from '../interfaces/IGameCore';

const gameKey = (roomId: string) => `game:state:${roomId}`;

class GameCore implements IGameCore {
    private async getState(roomId: string): Promise<GameState | null> {
        const raw = await redisClient.get(gameKey(roomId));
        if (!raw) return null;
        return JSON.parse(raw) as GameState;
    }

    private async setState(roomId: string, state: GameState): Promise<void> {
        await redisClient.set(gameKey(roomId), JSON.stringify(state));
    }

    private async deleteState(roomId: string): Promise<void> {
        await redisClient.del(gameKey(roomId));
    }

    private cloneCards(cards: CardData[] | null): CardData[] | null {
        if (!cards) {
            return null;
        }
        return cards.map((card) => ({ ...card }));
    }

    private cloneHands(hands: HandsType): HandsType {
        const cloned: HandsType = {};
        for (const playerId in hands) {
            const hand = hands[playerId];
            cloned[playerId] = {
                cash: hand.cash,
                score: hand.score,
                bet: hand.bet,
                cards: this.cloneCards(hand.cards),
            };
        }
        return cloned;
    }

    private cloneRoom(roomState: GameState): GameState {
        return {
            deck: roomState.deck.map((card) => ({ ...card })),
            round: roomState.round,
            hands: this.cloneHands(roomState.hands),
            totalBetting: roomState.totalBetting,
        };
    }

    private getRequiredPlayer(roomState: GameState, playerId: string): HandsType[string] | null {
        return roomState.hands[playerId] ?? null;
    }

    async getRoom(roomId: string): Promise<GameState | undefined> {
        const roomState = await this.getState(roomId);
        if (!roomState) return undefined;
        return this.cloneRoom(roomState);
    }

    async getPlayer(roomId: string, playerId: string) {
        const roomState = await this.getState(roomId);
        if (!roomState) return undefined;

        const playerState = roomState.hands[playerId];
        if (!playerState) return undefined;

        return {
            cash: playerState.cash,
            score: playerState.score,
            bet: playerState.bet,
            cards: this.cloneCards(playerState.cards),
        };
    }

    async destroy(roomId: string): Promise<void> {
        await this.deleteState(roomId);
    }

    async clearPlayer(roomId: string, playerId: string) {
        const roomState = await this.getState(roomId);
        if (!roomState) return undefined;
        if (!roomState.hands[playerId]) return undefined;

        delete roomState.hands[playerId];
        await this.setState(roomId, roomState);
        return this.getRoom(roomId);
    }

    async start(roomId: string, players: string[]) {
        if (players.length === 0) return undefined;

        // Preserve existing player cash/score between rounds if state exists
        const existingState = await this.getState(roomId);
        const existingHands = existingState?.hands ?? {};

        const initDeck = shuffleDeck(createDeck());
        const hands: HandsType = {};
        for (const player of players) {
            hands[player] = existingHands[player] ?? {
                cash: INIT_CASH,
                score: INIT_SCORE,
                cards: null,
                bet: INIT_BETTING,
            };
        }

        const newState: GameState = { deck: initDeck, round: 0, hands, totalBetting: 0 };
        await this.setState(roomId, newState);
        return this.cloneRoom(newState);
    }

    async deal(roomId: string, playerId: string, times: number, isFirstDraw = true) {
        const roomState = await this.getState(roomId);
        if (!roomState) return undefined;

        const playerState = roomState.hands[playerId];
        if (!playerState) return undefined;

        if (times <= 0) {
            return { playerState, round: roomState.round };
        }

        const { hands, deck: initialDeck } = roomState;
        let currentDeck = initialDeck;
        const hasSymbolCard = playerState.cards?.some(
            (card) => card.type === 'sqrt' || card.type === 'multiply'
        );

        let drawnCards: CardData[] = [];
        for (let i = 0; i < times; i++) {
            const result = (isFirstDraw || hasSymbolCard)
                ? drawOnlyNumber(currentDeck)
                : drawCard(currentDeck);

            if (result instanceof Error || !result) continue;

            const { card, deck: remainingDeck } = result;
            currentDeck = remainingDeck;
            if (card) {
                if (Array.isArray(card)) {
                    drawnCards = [...drawnCards, ...card];
                } else {
                    drawnCards.push(card);
                }
            }
        }

        const shouldAddDefaultOps = isFirstDraw && (playerState.cards ?? []).length === 0;
        const defaultOperationCards = shouldAddDefaultOps
            ? DEFAULT_OPERATION_CARDS.map((card) => ({ ...card }))
            : [];

        const updatedPlayer = {
            cash: playerState.cash,
            score: playerState.score,
            bet: playerState.bet,
            cards: [
                ...(playerState.cards ?? []),
                ...drawnCards,
                ...defaultOperationCards,
            ],
        };

        const nextRoomState: GameState = {
            ...roomState,
            hands: { ...hands, [playerId]: updatedPlayer },
            deck: currentDeck,
            round: roomState.round + 1,
        };
        await this.setState(roomId, nextRoomState);

        return {
            playerState: nextRoomState.hands[playerId],
            round: roomState.round + 1,
        };
    }

    async bet(roomId: string, playerId: string, betting: number) {
        const roomState = await this.getState(roomId);
        if (!roomState) return undefined;

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!playerState) return undefined;

        if (betting <= 0 || betting > playerState.cash) return undefined;

        const nextRoomState: GameState = {
            ...roomState,
            hands: {
                ...roomState.hands,
                [playerId]: { ...playerState, bet: playerState.bet + betting, cash: playerState.cash - betting },
            },
            totalBetting: roomState.totalBetting + betting,
        };
        await this.setState(roomId, nextRoomState);
        return this.getPlayer(roomId, playerId);
    }

    async fold(roomId: string, playerId: string) {
        const roomState = await this.getState(roomId);
        if (!roomState) return undefined;

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!playerState) return undefined;

        const nextRoomState: GameState = {
            ...roomState,
            hands: { ...roomState.hands, [playerId]: { ...playerState, cards: null } },
        };
        await this.setState(roomId, nextRoomState);
        return this.getPlayer(roomId, playerId);
    }

    async setSubmission(roomId: string, playerId: string, result: number) {
        const roomState = await this.getState(roomId);
        if (!roomState) return undefined;

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!playerState) return undefined;

        const nextRoomState: GameState = {
            ...roomState,
            hands: { ...roomState.hands, [playerId]: { ...playerState, score: result } },
        };
        await this.setState(roomId, nextRoomState);
        return this.getPlayer(roomId, playerId);
    }

    async finalizeRound(roomId: string) {
        const roomState = await this.getState(roomId);
        if (!roomState) return undefined;

        const highestScore = { id: '', score: 0 };
        for (const player in roomState.hands) {
            const playerState = roomState.hands[player];
            if (playerState.cards && playerState.score > highestScore.score) {
                highestScore.id = player;
                highestScore.score = playerState.score;
            }
        }

        const nextHands: HandsType = {};
        for (const playerId in roomState.hands) {
            const playerState = roomState.hands[playerId];
            const wonCash = playerId === highestScore.id ? roomState.totalBetting : 0;
            nextHands[playerId] = {
                ...playerState,
                cash: playerState.cash + wonCash,
                bet: 0,
                cards: null,
                score: 0,
            };
        }

        const nextRoomState: GameState = { ...roomState, hands: nextHands, totalBetting: 0 };
        await this.setState(roomId, nextRoomState);
        return this.getRoom(roomId);
    }
}


module.exports = GameCore;