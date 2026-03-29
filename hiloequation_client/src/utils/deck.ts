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

/** Draw from top until we get a Number card. Non-number cards go to the bottom. */
function drawNumberCard(deck: CardData[]): { card: CardData | null; deck: CardData[] } {
  let d = [...deck];
  while (d.length > 0) {
    const [top, ...rest] = d;
    if (top.type === 'number') return { card: top, deck: rest };
    d = [...rest, top]; // send symbol to bottom
  }
  return { card: null, deck: d };
}

/*
Round 1 & 3 delivery: draw 1 Number Card (symbols go to bottom until a number appears).
 */
export function deliverRound1(deck: CardData[]): { delivered: CardData[]; deck: CardData[] } {
  const { card, deck: remaining } = drawNumberCard(deck);
  return { delivered: card ? [card] : [], deck: remaining };
}

/*
 Round 2 delivery: draw 2 open cards.
- If an open card is √ → draw 1 extra Number Card (symbols skipped to bottom).
- If an open card is × → draw 1 extra Number Card (symbols skipped to bottom).
 */
export function deliverRound2(deck: CardData[]): { delivered: CardData[]; deck: CardData[] } {
  let d = [...deck];
  const delivered: CardData[] = [];

  for (let i = 0; i < 2; i++) {
    if (d.length === 0) break;
    const [top, ...rest] = d;
    d = rest;
    delivered.push(top);

    if (top.type === 'sqrt' || top.type === 'multiply') {
      const { card: extra, deck: newD } = drawNumberCard(d);
      if (extra) {
        delivered.push(extra);
        d = newD;
      }
    }
  }

  return { delivered, deck: d };
}
