export type Suit = 'gold' | 'silver' | 'bronze' | 'black';

export type CardType = 'number' | 'sqrt' | 'multiply' | 'operation';

export type OperationSymbol = '+' | '-' | '÷';

export type CardData = {
  id: string;
  type: CardType;
  suit?: Suit;
  value?: number;
  operation?: OperationSymbol;
};

export const DEFAULT_OPERATION_CARDS: CardData[] = [
  { id: 'op-add', type: 'operation', operation: '+' },
  { id: 'op-sub', type: 'operation', operation: '-' },
  { id: 'op-div', type: 'operation', operation: '÷' },
];
