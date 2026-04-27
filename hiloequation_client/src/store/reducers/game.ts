import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CardData } from '@/types/card';

export type HandSnapshot = {
    cash: number;
    score: number;
    bet: number;
    cards: CardData[] | null;
};

export type ServerRoomState = {
    round: number;
    totalBetting: number;
    hands: Record<string, HandSnapshot>;
};

export type GameState = ServerRoomState & {
    status: 'idle' | 'loading' | 'failed';
    isPlaying: boolean;
};

const initialState: GameState = {
    round: 0,
    totalBetting: 0,
    hands: {},
    isPlaying: false,
    status: 'idle',
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setGameState: (state, action: PayloadAction<ServerRoomState>) => {
            state.round = action.payload.round;
            state.totalBetting = action.payload.totalBetting;
            state.hands = action.payload.hands;
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
        setPlayingStatus: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        resetGame: () => initialState,
    },
});

export const { setGameState, updateHand, resetGame, setPlayingStatus } = gameSlice.actions;
export default gameSlice.reducer;
