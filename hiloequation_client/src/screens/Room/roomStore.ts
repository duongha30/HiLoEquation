import { create } from 'zustand';
import { createDeck, shuffleDeck } from '@/utils/deck';
import { DEFAULT_OPERATION_CARDS } from '@/types/card';
import type { CardData } from '@/types/card';

interface RoomState {
    deckCards: CardData[];
    playerCards: CardData[];
    deliveryCount: number;
    activeId: string | null;
    cardTranslates: Record<string, number>;

    setDeckCards: (cards: CardData[] | ((prev: CardData[]) => CardData[])) => void;
    setPlayerCards: (cards: CardData[] | ((prev: CardData[]) => CardData[])) => void;
    setDeliveryCount: (count: number) => void;
    setActiveId: (id: string | null) => void;
    setCardTranslates: (translates: Record<string, number>) => void;
    resetDeck: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
    deckCards: shuffleDeck(createDeck()),
    playerCards: DEFAULT_OPERATION_CARDS,
    deliveryCount: 0,
    activeId: null,
    cardTranslates: {},

    setDeckCards: (cards) =>
        set((state) => ({ deckCards: typeof cards === 'function' ? cards(state.deckCards) : cards })),
    setPlayerCards: (cards) =>
        set((state) => ({ playerCards: typeof cards === 'function' ? cards(state.playerCards) : cards })),
    setDeliveryCount: (count) => set({ deliveryCount: count }),
    setActiveId: (id) => set({ activeId: id }),
    setCardTranslates: (translates) => set({ cardTranslates: translates }),
    resetDeck: () => set({ deckCards: shuffleDeck(createDeck()), deliveryCount: 0 }),
}))