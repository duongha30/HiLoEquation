import { create } from 'zustand';
import type { CardData } from '@/types/card';

interface RoomState {
    cardTranslates: Record<string, number>;
    readyPlayers: string[];

    setCardTranslates: (translates: Record<string, number>) => void;
    setPlayerReady: (playerId: string, isReady: boolean) => void;
    resetReady: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
    cardTranslates: {},
    readyPlayers: [],

    setCardTranslates: (translates) => set({ cardTranslates: translates }),
    setPlayerReady: (playerId, isReady) =>
        set((state) => ({
            readyPlayers: isReady
                ? [...new Set([...state.readyPlayers, playerId])]
                : state.readyPlayers.filter((id) => id !== playerId),
        })),
    resetReady: () => set({ readyPlayers: [] }),
}))