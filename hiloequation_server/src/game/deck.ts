"use strict"

import type { CardData, Suit } from './types.ts';


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
    const shuffleDeck = [...deck];
    for (let i = shuffleDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffleDeck[j];
        shuffleDeck[j] = shuffleDeck[i];
        shuffleDeck[i] = temp;
    }
    return shuffleDeck;
}

export function drawOnlyNumber(deck: CardData[]) {
    let d = [...deck];

    if (d.length === 0) return { card: null, deck: d };

    while (d.length > 0) {
        const [top, ...rest] = d;
        if (top.type === 'number') return { card: top, deck: rest };
        d = [...rest, top]; // send symbol to bottom
    }
    return { card: null, deck: d };
}

export function drawCard(deck: CardData[]) {
    if (deck.length === 0) return { card: null, deck };

    let d = [...deck];
    const [top, ...rest] = d;

    if (top.type === 'number') return { card: top, deck: rest };
    if (top.type === 'sqrt' || top.type === 'multiply') {
        const delivered = [top];
        const result = drawOnlyNumber(rest);

        if (!result.card) {
            return { card: delivered, deck: result.deck }; // the last card may be a sqrt or multiply, but we still deliver it
        }

        const { card: extra, deck: newD } = result;
        delivered.push(extra);
        return { card: delivered, deck: newD };
    }

    return drawOnlyNumber(rest);
}

export function addSymbolIfNotExists(deck: CardData[], newCard: CardData | CardData[]): CardData[] {
    if (!Array.isArray(newCard)) {
        deck.push(newCard);
        return deck;
    }

    for (const card of newCard) {
        if (card.type === 'sqrt' || card.type === 'multiply') {
            const exists = deck.some(existingCard => existingCard.type === card.type);
            if (!exists) {
                deck.push(card);
            }
        }
    }
    return deck;
}