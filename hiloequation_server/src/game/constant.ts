import type { CardData } from "./types";

export const DEFAULT_OPERATION_CARDS: CardData[] = [
    { id: 'op-add', type: 'operation', operation: '+' },
    { id: 'op-sub', type: 'operation', operation: '-' },
    { id: 'op-div', type: 'operation', operation: '÷' },
];

export const INIT_CASH = 2000;
export const INIT_SCORE = 0;
export const INIT_BETTING = 0;