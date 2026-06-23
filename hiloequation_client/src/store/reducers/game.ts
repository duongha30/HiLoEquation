import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CardData } from '@/types/card';
import type { PotSelection, Submission, RevealedHands, ShowdownWinner } from '@/types/game';

export type ShowdownResult = {
    hiWinner: ShowdownWinner;
    loWinner: ShowdownWinner;
};

export type HandSnapshot = {
    cash: number;
    score: number;
    bet: number;
    cards: CardData[] | null;
    potSelection: PotSelection;
    hiSubmission: Submission;
    loSubmission: Submission;
};

export type BettingRoundState = {
    active: boolean;
    activePlayers: string[];
    currentTurnPlayerId: string;
    currentBet: number;
    contributions: Record<string, number>;
    lastRaiserId: string;
};

export type ServerRoomState = {
    round: number;
    totalBetting: number;
    hands: Record<string, HandSnapshot>;
    bettingRound?: BettingRoundState | null;
};

export type GameState = ServerRoomState & {
    status: 'idle' | 'loading' | 'failed';
    isPlaying: boolean;
    bettingRound: BettingRoundState | null;
    isForcedBetPhase: boolean;
    revealedHands: RevealedHands;
    declareDeadlineAt: number | null;
    showdownResult: ShowdownResult | null;
};

const initialState: GameState = {
    round: 0,
    totalBetting: 0,
    hands: {},
    isPlaying: false,
    status: 'idle',
    bettingRound: null,
    isForcedBetPhase: false,
    revealedHands: {},
    declareDeadlineAt: null,
    showdownResult: null,
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setGameState: (state, action: PayloadAction<ServerRoomState>) => {
            state.round = action.payload.round;
            state.totalBetting = action.payload.totalBetting;
            state.hands = action.payload.hands;
            state.bettingRound = action.payload.bettingRound ?? null;
            if (action.payload.round === 0) {
                state.revealedHands = {};
                state.declareDeadlineAt = null;
                state.showdownResult = null;
            }
        },
        setGameStateWithoutCards: (state, action: PayloadAction<ServerRoomState>) => {
            state.round = action.payload.round;
            state.totalBetting = action.payload.totalBetting;
            state.bettingRound = action.payload.bettingRound ?? null;
            for (const [playerId, hand] of Object.entries(action.payload.hands)) {
                const existingCards = state.hands[playerId]?.cards ?? null;
                state.hands[playerId] = { ...hand, cards: existingCards };
            }
        },
        updateHand: (state, action: PayloadAction<{ playerId: string; hand: Partial<HandSnapshot>; totalBetting?: number }>) => {
            const { playerId, hand, totalBetting } = action.payload;
            if (state.hands[playerId]) {
                state.hands[playerId] = { ...state.hands[playerId], ...hand };
            }
            if (totalBetting !== undefined) {
                state.totalBetting = totalBetting;
            }
        },
        updateRound: (state, action: PayloadAction<number>) => {
            state.round = action.payload;
        },
        setIsForcedBetPhase: (state, action: PayloadAction<boolean>) => {
            state.isForcedBetPhase = action.payload;
        },
        setRevealedHands: (state, action: PayloadAction<RevealedHands>) => {
            state.revealedHands = action.payload;
        },
        setDeclareDeadlineAt: (state, action: PayloadAction<number | null>) => {
            state.declareDeadlineAt = action.payload;
        },
        setShowdownResult: (state, action: PayloadAction<ShowdownResult | null>) => {
            state.showdownResult = action.payload;
        },
        setPlayingStatus: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        resetGame: () => initialState,
    },
});

export const {
    setGameState,
    setGameStateWithoutCards,
    updateHand,
    resetGame,
    setPlayingStatus,
    updateRound,
    setIsForcedBetPhase,
    setRevealedHands,
    setDeclareDeadlineAt,
    setShowdownResult,
} = gameSlice.actions;
export default gameSlice.reducer;
