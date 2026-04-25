'use strict';
import { addSymbolIfNotExists, createDeck, drawOnlyNumber, drawCard, shuffleDeck } from './deck.ts';
import type {
    CardData,
    GameState,
    HandsType,
} from './types.ts';
import { INIT_CASH, INIT_SCORE, INIT_BETTING, DEFAULT_OPERATION_CARDS } from './constant.ts';

class GameCore {
    gameState = new Map<string, GameState>();

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

    private getRequiredRoom(roomId: string): GameState | null {
        return this.gameState.get(roomId) ?? null;
    }

    private getRequiredPlayer(roomState: GameState, playerId: string): HandsType[string] | null {
        return roomState.hands[playerId] ?? null;
    }

    getRoom(roomId: string) {
        const roomState = this.gameState.get(roomId);
        if (!roomState) {
            return;
        }
        return this.cloneRoom(roomState);
    }

    getPlayer(roomId: string, playerId: string) {
        const roomState = this.gameState.get(roomId);
        if (!roomState) {
            return;
        }

        const playerState = roomState.hands[playerId];
        if (!playerState) {
            return;
        }

        return {
            cash: playerState.cash,
            score: playerState.score,
            bet: playerState.bet,
            cards: this.cloneCards(playerState.cards),
        };
    }

    destroy(roomId: string) {
        this.gameState.delete(roomId);
    }

    clearPlayer(roomId: string, playerId: string) {
        const roomState = this.gameState.get(roomId);
        if (!roomState) {
            return;
        }

        if (!roomState.hands[playerId]) {
            return;
        }

        delete roomState.hands[playerId];
        this.gameState.set(roomId, roomState);
        return this.getRoom(roomId);
    }

    start(roomId: string, players: string[]) {
        const roomState = this.getRequiredRoom(roomId);
        if (!roomState) {
            return;
        }

        if (players.length === 0) {
            return;
        }

        const initDeck = shuffleDeck(createDeck());
        const hands: HandsType = {};
        for (const player of players) {
            hands[player] = roomState.hands[player] ?? {
                cash: INIT_CASH,
                score: INIT_SCORE,
                cards: null,
                bet: INIT_BETTING,
            }
        }
        this.gameState.set(roomId, { deck: initDeck, round: 0, hands, totalBetting: 0 });
        return this.getRoom(roomId);
    }

    deal(roomId: string, playerId: string, times: number, isFirstDraw = true) {
        const roomState = this.getRequiredRoom(roomId);
        if (!roomState) {
            return;
        }

        const playerState = roomState.hands[playerId];
        if (!playerState) {
            return;
        }

        if (times <= 0) {
            return {
                playerState,
                round: roomState.round,
            };
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

            if (result instanceof Error || !result) {
                continue;
            }

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
            hands: {
                ...hands,
                [playerId]: updatedPlayer,
            },
            deck: currentDeck,
            round: roomState.round + 1,
        };
        this.gameState.set(roomId, nextRoomState);

        return {
            playerState: nextRoomState.hands[playerId],
            round: roomState.round + 1,
        };
    }

    bet(roomId: string, playerId: string, betting: number) {
        const roomState = this.getRequiredRoom(roomId);
        if (!roomState) {
            return;
        }

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!roomState || !playerState) {
            return;
        }

        if (betting <= 0 || betting > playerState.cash) {
            return;
        }

        const updatedPlayer = {
            ...playerState,
            bet: playerState.bet + betting,
            cash: playerState.cash - betting,
        };

        const nextRoomState: GameState = {
            ...roomState,
            hands: {
                ...roomState.hands,
                [playerId]: updatedPlayer,
            },
            totalBetting: roomState.totalBetting + betting,
        };

        this.gameState.set(roomId, nextRoomState);
        return this.getPlayer(roomId, playerId);
    }

    fold(roomId: string, playerId: string) {
        const roomState = this.getRequiredRoom(roomId);
        if (!roomState) {
            return;
        }

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!playerState) {
            return;
        }

        const nextRoomState: GameState = {
            ...roomState,
            hands: {
                ...roomState.hands,
                [playerId]: {
                    ...playerState,
                    cards: null,
                },
            },
        };

        this.gameState.set(roomId, nextRoomState);
        return this.getPlayer(roomId, playerId);
    }

    setSubmission(roomId: string, playerId: string, result: number) {
        const roomState = this.getRequiredRoom(roomId);
        if (!roomState) {
            return;
        }

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!roomState || !playerState) {
            return;
        }

        const nextRoomState: GameState = {
            ...roomState,
            hands: {
                ...roomState.hands,
                [playerId]: {
                    ...playerState,
                    score: result,
                },
            },
        };

        this.gameState.set(roomId, nextRoomState);
        return this.getPlayer(roomId, playerId);
    }

    finalizeRound(roomId: string) {
        const roomState = this.getRequiredRoom(roomId);
        if (!roomState) {
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

        const nextRoomState: GameState = {
            ...roomState,
            hands: nextHands,
            totalBetting: 0,
        };

        this.gameState.set(roomId, nextRoomState);
        return this.getRoom(roomId);
    }
}


module.exports = GameCore;