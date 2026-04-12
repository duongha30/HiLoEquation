'use strict';
import { addCardIfNotExists, createDeck, drawOnlyNumber, drawCard, shuffleDeck } from './deck';
import type {
    CardData,
    GameState,
    HandsType,
} from './types';
import { INIT_CASH, INIT_SCORE, INIT_BETTING, DEFAULT_OPERATION_CARDS } from './constant';

class GameCore {
    gameState = new Map<string, GameState>();

    getRoom(roomId: string) {
        return this.gameState.get(roomId);
    }

    getPlayer(roomId: string, playerId: string) {
        return this.gameState.get(roomId)?.hands[playerId];
    }

    start(roomId: string, players: string[]) {
        const initDeck = shuffleDeck(createDeck());
        const hands: HandsType = {};
        for (const player of players) {
            hands[player] = {
                cash: INIT_CASH,
                score: INIT_SCORE,
                cards: null,
                bet: INIT_BETTING,
            }
        }
        this.gameState.set(roomId, { deck: initDeck, round: 0, hands, totalBetting: 0 });
        return this.getRoom(roomId);
    }

    deal(roomId: string, times: number, isFirstDraw = true) {
        const roomState = this.getRoom(roomId);
        if (!roomState) {
            console.log('Error in dealing cards', roomState)
            return;
        }
        const { hands, deck: initialDeck } = roomState;
        let currentDeck = initialDeck;
        const newHands: HandsType = {};

        for (const playerId in hands) {
            const playerState = hands[playerId];
            const hasSymbolCard = playerState.cards?.some(
                (card) => card.type === 'sqrt' || card.type === 'multiply'
            );

            const drawnCards: CardData[] = [];
            for (let i = 0; i < times; i++) {
                const result = (isFirstDraw || hasSymbolCard)
                    ? drawOnlyNumber(currentDeck)
                    : drawCard(currentDeck);

                if (result instanceof Error || !result) {
                    continue;
                }

                const { card, deck: remainingDeck } = result;
                currentDeck = remainingDeck;

                if (card) {
                    addCardIfNotExists(drawnCards, card);
                }
            }

            newHands[playerId] = {
                cash: playerState.cash,
                score: playerState.score,
                bet: playerState.bet,
                cards: [...(playerState.cards ?? []), ...drawnCards, ...(isFirstDraw ? DEFAULT_OPERATION_CARDS : [])],
            };
        }

        roomState.hands = newHands;
        roomState.deck = currentDeck;
        roomState.round += 1;
        this.gameState.set(roomId, roomState);
        return this.getRoom(roomId);
    }

    bet(roomId: string, playerId: string, betting: number) {
        const roomState = this.getRoom(roomId);
        const playerState = this.getPlayer(roomId, playerId);
        if (!roomState || !playerState) {
            console.log('Error in betting', roomState, playerState)
            return;
        }
        playerState.bet += betting;
        playerState.cash -= betting;
        roomState.hands[playerId] = playerState;
        roomState.totalBetting += betting;
        this.gameState.set(roomId, roomState);
        return this.getPlayer(roomId, playerId);
    }

    fold(roomId: string, playerId: string) {
        const roomState = this.getRoom(roomId);
        if (!roomState) {
            console.log('Error in folding', roomState)
            return;
        }
        roomState.hands[playerId].cards = null;
        this.gameState.set(roomId, roomState);
        return this.getPlayer(roomId, playerId);
    }

    setSubmission(roomId: string, playerId: string, result: number) {
        const roomState = this.getRoom(roomId);
        const playerState = this.getPlayer(roomId, playerId);
        if (!roomState || !playerState) {
            console.log('Error in setSubmission', roomState, playerState)
            return;
        }
        playerState.score = result;
        roomState.hands[playerId] = playerState;
        this.gameState.set(roomId, roomState);
    }

    finalizeRound(roomId: string) {
        const roomState = this.getRoom(roomId);
        if (!roomState) {
            console.log('Error in finalizeRound', roomState)
            return;
        }
        const highestScore = { id: '', score: 0 };
        for (const player in roomState.hands) {
            const playerState = roomState.hands[player];
            if (playerState.cards && playerState.score > highestScore.score) {
                highestScore.id = player;
                highestScore.score = playerState.score;
            }
        }
        roomState.hands[highestScore.id].cash += roomState.totalBetting;
        roomState.totalBetting = 0;
        for (const player in roomState.hands) {
            roomState.hands[player].bet = 0;
            roomState.hands[player].cards = null;
            roomState.hands[player].score = 0;
        }
        this.gameState.set(roomId, roomState);
        return this.getRoom(roomId);
    }
}


export const Game = new GameCore();