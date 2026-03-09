export type Suit = 'gold' | 'silver' | 'bronze' | 'black';

export type CardType = 'number' | 'sqrt' | 'multiply';

export type CardData = {
  id: string;
  type: CardType;
  suit: Suit;
  value?: number;
};
