'use strict';
import { createDeck, drawOnlyNumber, shuffleDeck } from './deck.ts';
import { scanningCard } from './scanningCard.ts';
import type {
    CardData,
    GameState,
    HandsType,
    BettingRoundState,
} from './types.ts';
import { INIT_CASH, INIT_SCORE, INIT_BETTING, DEFAULT_OPERATION_CARDS } from './constant.ts';
import redisClient from '../dbs/init.redis';
import type { IGameCore } from '../interfaces/IGameCore';

const gameKey = (roomCode: string) => `game:state:${roomCode}`;

class GameCore implements IGameCore {
    private async getState(roomCode: string): Promise<GameState | null> {
        const raw = await redisClient.get(gameKey(roomCode));
        if (!raw) return null;
        return JSON.parse(raw) as GameState;
    }

    private async setState(roomCode: string, state: GameState): Promise<void> {
        await redisClient.set(gameKey(roomCode), JSON.stringify(state));
    }

    private async deleteState(roomCode: string): Promise<void> {
        await redisClient.del(gameKey(roomCode));
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
                potSelection: hand.potSelection,
                hiSubmission: hand.hiSubmission ? { cards: this.cloneCards(hand.hiSubmission.cards) ?? [], result: hand.hiSubmission.result } : null,
                loSubmission: hand.loSubmission ? { cards: this.cloneCards(hand.loSubmission.cards) ?? [], result: hand.loSubmission.result } : null,
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
            bettingRound: roomState.bettingRound
                ? {
                    ...roomState.bettingRound,
                    activePlayers: [...roomState.bettingRound.activePlayers],
                    contributions: { ...roomState.bettingRound.contributions },
                }
                : null,
            nextStarterIndex: roomState.nextStarterIndex,
            declareDeadlineAt: roomState.declareDeadlineAt,
        };
    }

    private suitRank(suit?: string): number {
        const ranks: Record<string, number> = { gold: 3, silver: 2, bronze: 1, black: 0 };
        return suit ? (ranks[suit] ?? -1) : -1;
    }

    private highestCardValue(submission: { cards: CardData[]; result: number } | null): { value: number; suitRank: number } {
        if (!submission) return { value: -1, suitRank: -1 };
        let best = { value: -1, suitRank: -1 };
        for (const card of submission.cards) {
            if (card.type !== 'number' || card.value === undefined) continue;
            const sRank = this.suitRank(card.suit);
            if (card.value > best.value || (card.value === best.value && sRank > best.suitRank)) {
                best = { value: card.value, suitRank: sRank };
            }
        }
        return best;
    }

    private pickWinner(
        candidates: Array<{ playerId: string; submission: { cards: CardData[]; result: number } }>,
        target: number
    ): string | null {
        if (candidates.length === 0) return null;

        let best = candidates[0];
        let bestDiff = Math.abs(best.submission.result - target);
        let bestTie = this.highestCardValue(best.submission);

        for (const candidate of candidates.slice(1)) {
            const diff = Math.abs(candidate.submission.result - target);
            if (diff < bestDiff) {
                best = candidate;
                bestDiff = diff;
                bestTie = this.highestCardValue(candidate.submission);
                continue;
            }
            if (diff === bestDiff) {
                const tie = this.highestCardValue(candidate.submission);
                if (tie.value > bestTie.value || (tie.value === bestTie.value && tie.suitRank > bestTie.suitRank)) {
                    best = candidate;
                    bestTie = tie;
                }
            }
        }
        return best.playerId;
    }

    private getRequiredPlayer(roomState: GameState, playerId: string): HandsType[string] | null {
        return roomState.hands[playerId] ?? null;
    }

    private allActivePlayersComplete(roomState: GameState): boolean {
        const activePlayers = Object.values(roomState.hands).filter((p) => p.cards !== null);
        if (activePlayers.length === 0) return false;
        return activePlayers.every((p) => {
            if (p.potSelection === 'hi') return p.hiSubmission !== null;
            if (p.potSelection === 'lo') return p.loSubmission !== null;
            if (p.potSelection === 'swing') return p.hiSubmission !== null && p.loSubmission !== null;
            return false;
        });
    }

    async getRoom(roomCode: string): Promise<GameState | undefined> {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;
        return this.cloneRoom(roomState);
    }

    async getPlayer(roomCode: string, playerId: string) {
        const roomState = await this.getState(roomCode);
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

    async destroy(roomCode: string): Promise<void> {
        await this.deleteState(roomCode);
    }

    async clearPlayer(roomCode: string, playerId: string) {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;
        if (!roomState.hands[playerId]) return undefined;

        delete roomState.hands[playerId];
        await this.setState(roomCode, roomState);
        return this.getRoom(roomCode);
    }

    async start(roomCode: string, players: string[]) {
        if (players.length === 0) return undefined;

        // Preserve existing player cash/score between rounds if state exists
        const existingState = await this.getState(roomCode);
        const existingHands = existingState?.hands ?? {};

        const initDeck = shuffleDeck(createDeck());
        const hands: HandsType = {};
        for (const player of players) {
            hands[player] = {
                cash: existingHands[player]?.cash ?? INIT_CASH,
                score: INIT_SCORE,
                cards: null,
                bet: INIT_BETTING,
                potSelection: null,
                hiSubmission: null,
                loSubmission: null,
            };
        }

        const newState: GameState = {
            deck: initDeck,
            round: 0,
            hands,
            totalBetting: 0,
            bettingRound: null,
            nextStarterIndex: existingState?.nextStarterIndex ?? 0,
            declareDeadlineAt: null,
        };
        await this.setState(roomCode, newState);
        return this.cloneRoom(newState);
    }

    async deal(roomCode: string, players: string[], times: number, isFirstDraw = false) {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;
        if (times <= 0) {
            return this.cloneRoom(roomState);
        }

        let currentDeck = roomState.deck;
        const nextHands: HandsType = { ...roomState.hands };

        for (const playerId of players) {
            const playerState = nextHands[playerId];
            if (!playerState) return undefined;

            const existingCards = playerState.cards ?? [];
            let updatedCards = [...existingCards];
            let drawnCards: CardData[] = [];

            if (isFirstDraw) {
                for (let i = 0; i < times; i++) {
                    const result = drawOnlyNumber(currentDeck);
                    if (!result.card) continue;
                    currentDeck = result.deck;
                    drawnCards.push(result.card);
                }

                // Mark the first dealt number card as the hidden "hole card" — kept face-down
                // to opponents (encrypted on the wire) until showdown.
                if (drawnCards.length > 0) {
                    drawnCards[0] = { ...drawnCards[0], hidden: true };
                }

                const shouldAddDefaultOps = existingCards.length === 0;
                const defaultOps = shouldAddDefaultOps
                    ? DEFAULT_OPERATION_CARDS.map((c) => ({ ...c }))
                    : [];

                nextHands[playerId] = {
                    cash: playerState.cash,
                    score: playerState.score,
                    bet: playerState.bet,
                    cards: [...existingCards, ...drawnCards, ...defaultOps],
                    potSelection: playerState.potSelection,
                    hiSubmission: playerState.hiSubmission,
                    loSubmission: playerState.loSubmission,
                };
            } else {
                // Round deal: always draw exactly one number card (unencrypted)
                const baseResult = drawOnlyNumber(currentDeck);
                if (baseResult.card) {
                    currentDeck = baseResult.deck;
                    drawnCards.push(baseResult.card);
                }

                const hasSqrt = existingCards.some((c) => c.type === 'sqrt');
                const hasMultiply = existingCards.some((c) => c.type === 'multiply');

                // √ bonus: draw one additional number card
                if (hasSqrt) {
                    const r = drawOnlyNumber(currentDeck);
                    if (r.card) {
                        currentDeck = r.deck;
                        drawnCards.push(r.card);
                    }
                }

                // × effect: discard one random operator card, draw one additional number card
                if (hasMultiply) {
                    const opIndices = existingCards
                        .map((c, i) => (c.type === 'operation' ? i : -1))
                        .filter((i) => i >= 0);
                    if (opIndices.length > 0) {
                        const removeIdx = opIndices[Math.floor(Math.random() * opIndices.length)];
                        updatedCards = existingCards.filter((_, i) => i !== removeIdx);
                    }
                    const r = drawOnlyNumber(currentDeck);
                    if (r.card) {
                        currentDeck = r.deck;
                        drawnCards.push(r.card);
                    }
                }

                nextHands[playerId] = {
                    cash: playerState.cash,
                    score: playerState.score,
                    bet: playerState.bet,
                    cards: [...updatedCards, ...drawnCards],
                    potSelection: playerState.potSelection,
                    hiSubmission: playerState.hiSubmission,
                    loSubmission: playerState.loSubmission,
                };
            }
        }

        const nextRoomState: GameState = {
            ...roomState,
            hands: nextHands,
            deck: currentDeck,
        };
        await this.setState(roomCode, nextRoomState);
        return this.cloneRoom(nextRoomState);
    }

    async bet(roomCode: string, playerId: string, betting: number, isFirstBet: boolean) {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!playerState) return undefined;

        if (betting <= 0 || betting > playerState.cash) return undefined;

        const updatedHands: HandsType = {
            ...roomState.hands,
            [playerId]: { ...playerState, bet: playerState.bet + betting, cash: playerState.cash - betting },
        };

        const allEqualBet =
            isFirstBet &&
            roomState.round === 0 &&
            (() => {
                const active = Object.values(updatedHands).filter((p) => p.cards !== null);
                const first = active[0]?.bet ?? 0;
                return active.length > 0 && first > 0 && active.every((p) => p.bet === first);
            })();

        const nextRound = allEqualBet ? roomState.round + 1 : roomState.round;

        const nextRoomState: GameState = {
            ...roomState,
            hands: updatedHands,
            round: nextRound,
            totalBetting: roomState.totalBetting + betting,
        };
        await this.setState(roomCode, nextRoomState);

        const player = await this.getPlayer(roomCode, playerId);
        return player ? { ...player, round: nextRound } : undefined;
    }

    async fold(roomCode: string, playerId: string) {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!playerState) return undefined;

        const nextRoomState: GameState = {
            ...roomState,
            hands: { ...roomState.hands, [playerId]: { ...playerState, cards: null } },
        };
        await this.setState(roomCode, nextRoomState);
        return this.getPlayer(roomCode, playerId);
    }

    async setSubmission(roomCode: string, playerId: string, result: number) {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!playerState) return undefined;

        const nextRoomState: GameState = {
            ...roomState,
            hands: { ...roomState.hands, [playerId]: { ...playerState, score: result } },
        };
        await this.setState(roomCode, nextRoomState);
        return this.getPlayer(roomCode, playerId);
    }

    async declarePot(roomCode: string, playerId: string, selection: 'hi' | 'lo' | 'swing') {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;
        if (roomState.round !== 4) return undefined;

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!playerState || playerState.cards === null) return undefined;

        const nextRoomState: GameState = {
            ...roomState,
            hands: { ...roomState.hands, [playerId]: { ...playerState, potSelection: selection } },
        };
        await this.setState(roomCode, nextRoomState);
        return this.cloneRoom(nextRoomState);
    }

    async submitEquation(roomCode: string, playerId: string, target: 'hi' | 'lo', cards: CardData[]) {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;
        if (roomState.round !== 4) return undefined;

        const playerState = this.getRequiredPlayer(roomState, playerId);
        if (!playerState || playerState.cards === null) return undefined;

        const ownedIds = playerState.cards.map((c) => c.id).sort();
        const submittedIds = cards.map((c) => c.id).sort();
        if (ownedIds.length !== submittedIds.length || ownedIds.some((id, i) => id !== submittedIds[i])) {
            return undefined;
        }

        if (playerState.potSelection === 'hi' && target !== 'hi') return undefined;
        if (playerState.potSelection === 'lo' && target !== 'lo') return undefined;
        if (playerState.potSelection !== 'hi' && playerState.potSelection !== 'lo' && playerState.potSelection !== 'swing') return undefined;

        const orderedCards = cards.map((submitted) => playerState.cards!.find((owned) => owned.id === submitted.id)!);
        const { correctedCards, result } = scanningCard(orderedCards);

        const submission = { cards: correctedCards, result };
        const nextHand = target === 'hi'
            ? { ...playerState, hiSubmission: submission }
            : { ...playerState, loSubmission: submission };

        const nextRoomState: GameState = {
            ...roomState,
            hands: { ...roomState.hands, [playerId]: nextHand },
        };
        await this.setState(roomCode, nextRoomState);

        const allComplete = this.allActivePlayersComplete(nextRoomState);
        return { state: this.cloneRoom(nextRoomState), allComplete };
    }

    async finalizeRound(roomCode: string) {
        const roomState = await this.getState(roomCode);
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

        const playerCount = Object.keys(nextHands).length;
        const nextRoomState: GameState = {
            ...roomState,
            hands: nextHands,
            totalBetting: 0,
            bettingRound: null,
            nextStarterIndex: playerCount > 0
                ? (roomState.nextStarterIndex + 1) % playerCount
                : 0,
        };
        await this.setState(roomCode, nextRoomState);
        return this.getRoom(roomCode);
    }
    async startBettingRound(roomCode: string, players: string[]): Promise<GameState | undefined> {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;

        const starterIndex = roomState.nextStarterIndex % players.length;
        const ordered = [...players.slice(starterIndex), ...players.slice(0, starterIndex)];
        const activePlayers = ordered.filter((id) => roomState.hands[id]?.cards !== null);
        if (activePlayers.length < 2) return undefined;

        const contributions: Record<string, number> = {};
        for (const id of activePlayers) contributions[id] = 0;

        roomState.bettingRound = {
            active: true,
            activePlayers,
            currentTurnPlayerId: activePlayers[0],
            currentBet: 0,
            contributions,
            lastRaiserId: activePlayers[0],
        };

        await this.setState(roomCode, roomState);
        return this.cloneRoom(roomState);
    }

    async setDeclareDeadline(roomCode: string, deadlineAt: number) {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;
        roomState.declareDeadlineAt = deadlineAt;
        await this.setState(roomCode, roomState);
        return this.cloneRoom(roomState);
    }

    async processBettingAction(
        roomCode: string,
        playerId: string,
        action: 'bet' | 'check' | 'fold',
        amount?: number
    ): Promise<{ state: GameState; roundEnded: boolean } | undefined> {
        const roomState = await this.getState(roomCode);
        if (!roomState?.bettingRound?.active) return undefined;

        const br = roomState.bettingRound as BettingRoundState;
        if (br.currentTurnPlayerId !== playerId) return undefined;

        const player = roomState.hands[playerId];
        if (!player) return undefined;

        let prevIdx = br.activePlayers.indexOf(playerId);

        if (action === 'bet') {
            const amt = amount ?? 0;
            if (amt <= 0 || amt > player.cash) return undefined;
            const newContrib = br.contributions[playerId] + amt;
            if (newContrib < br.currentBet) return undefined;
            player.cash -= amt;
            br.contributions[playerId] = newContrib;
            roomState.totalBetting += amt;
            player.bet += amt;
            if (newContrib > br.currentBet) {
                br.currentBet = newContrib;
                br.lastRaiserId = playerId;
            }
        } else if (action === 'check') {
            if (br.contributions[playerId] < br.currentBet) return undefined;
        } else if (action === 'fold') {
            player.cards = null;
            br.activePlayers = br.activePlayers.filter((id) => id !== playerId);
        }

        let roundEnded = false;
        let consensusEnd = false;

        if (br.activePlayers.length <= 1) {
            roundEnded = true;
            br.active = false;
        } else {
            const nextIdx = action === 'fold'
                ? prevIdx % br.activePlayers.length
                : (prevIdx + 1) % br.activePlayers.length;
            const nextPlayer = br.activePlayers[nextIdx];
            br.currentTurnPlayerId = nextPlayer;

            if (nextPlayer === br.lastRaiserId || !br.activePlayers.includes(br.lastRaiserId)) {
                roundEnded = true;
                consensusEnd = true;
                br.active = false;
            }
        }

        if (consensusEnd) {
            roomState.round += 1;
        }

        await this.setState(roomCode, roomState);
        return { state: this.cloneRoom(roomState), roundEnded };
    }

    async runShowdown(roomCode: string) {
        const roomState = await this.getState(roomCode);
        if (!roomState) return undefined;

        type Candidate = { playerId: string; submission: { cards: CardData[]; result: number } };
        const hiCandidates: Candidate[] = [];
        const loCandidates: Candidate[] = [];

        for (const playerId in roomState.hands) {
            const hand = roomState.hands[playerId];
            if (hand.cards === null) continue;
            const selection = hand.potSelection ?? 'swing';
            if ((selection === 'hi' || selection === 'swing') && hand.hiSubmission) {
                hiCandidates.push({ playerId, submission: hand.hiSubmission });
            }
            if ((selection === 'lo' || selection === 'swing') && hand.loSubmission) {
                loCandidates.push({ playerId, submission: hand.loSubmission });
            }
        }

        const hiWinnerId = this.pickWinner(hiCandidates, 20);
        const loWinnerId = this.pickWinner(loCandidates, 1);

        const activeSelections = Object.values(roomState.hands)
            .filter((h) => h.cards !== null)
            .map((h) => h.potSelection);
        const allHi = activeSelections.length > 0 && activeSelections.every((s) => s === 'hi');
        const allLo = activeSelections.length > 0 && activeSelections.every((s) => s === 'lo');

        let hiPotAmount: number;
        let loPotAmount: number;
        if (allHi) {
            hiPotAmount = roomState.totalBetting;
            loPotAmount = 0;
        } else if (allLo) {
            hiPotAmount = 0;
            loPotAmount = roomState.totalBetting;
        } else {
            hiPotAmount = Math.floor(roomState.totalBetting / 2);
            loPotAmount = roomState.totalBetting - hiPotAmount;
        }

        const revealedHands: Record<string, { cards: CardData[]; potSelection: HandsType[string]['potSelection']; hiSubmission: HandsType[string]['hiSubmission']; loSubmission: HandsType[string]['loSubmission'] }> = {};
        const nextHands: HandsType = {};

        for (const playerId in roomState.hands) {
            const hand = roomState.hands[playerId];
            const arrangedCards = hand.hiSubmission?.cards ?? hand.loSubmission?.cards ?? hand.cards;
            revealedHands[playerId] = {
                cards: this.cloneCards(arrangedCards) ?? [],
                potSelection: hand.potSelection,
                hiSubmission: hand.hiSubmission,
                loSubmission: hand.loSubmission,
            };

            let wonCash = 0;
            if (playerId === hiWinnerId) wonCash += hiPotAmount;
            if (playerId === loWinnerId) wonCash += loPotAmount;

            nextHands[playerId] = {
                cash: hand.cash + wonCash,
                score: 0,
                bet: 0,
                cards: null,
                potSelection: null,
                hiSubmission: null,
                loSubmission: null,
            };
        }

        const playerCount = Object.keys(nextHands).length;
        const nextRoomState: GameState = {
            ...roomState,
            hands: nextHands,
            totalBetting: 0,
            bettingRound: null,
            declareDeadlineAt: null,
            nextStarterIndex: playerCount > 0 ? (roomState.nextStarterIndex + 1) % playerCount : 0,
        };
        await this.setState(roomCode, nextRoomState);

        return {
            hiWinner: hiWinnerId ? { playerId: hiWinnerId, result: roomState.hands[hiWinnerId].hiSubmission!.result, amount: hiPotAmount } : null,
            loWinner: loWinnerId ? { playerId: loWinnerId, result: roomState.hands[loWinnerId].loSubmission!.result, amount: loPotAmount } : null,
            revealedHands,
            roomState: this.cloneRoom(nextRoomState),
        };
    }
}


module.exports = GameCore;