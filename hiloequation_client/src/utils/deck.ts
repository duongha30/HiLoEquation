import type { CardData, Suit } from '../types/card';

const SUITS: Suit[] = ['gold', 'silver', 'bronze', 'black'];

export function createDeck(): CardData[] {
  const deck: CardData[] = [];

  for (const suit of SUITS) {
    for (let value = 0; value <= 10; value++) {
      deck.push({ id: `number-${suit}-${value}`, type: 'number', suit, value });
    }
  }

  for (const suit of SUITS) {
    deck.push({ id: `sqrt-${suit}`, type: 'sqrt', suit });
  }

  for (const suit of SUITS) {
    deck.push({ id: `multiply-${suit}`, type: 'multiply', suit });
  }

  return deck;
}

export function shuffleDeck(deck: CardData[]): CardData[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
