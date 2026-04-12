"use strict"

import type { CardData, Suit } from './types';


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
    while (d.length > 0) {
        if (d.length === 0) return new Error('Deck is empty');
        const [top, ...rest] = d;
        if (top.type === 'number') return { card: top, deck: rest };
        d = [...rest, top]; // send symbol to bottom
    }
    return { card: null, deck: d };
}

export function drawCard(deck: CardData[]) {
    const d = [...deck];
    if (d.length === 0) {
        return new Error('Deck is empty');
    }

    const [top, ...rest] = d;
    if (top.type === 'number') {
        return { card: top, deck: rest };
    }

    if (top.type === 'sqrt' || top.type === 'multiply') {
        const delivered = [top];
        const result = drawOnlyNumber(rest);

        if (result instanceof Error) {
            return result;
        }

        if (!result.card) {
            return { card: delivered, deck: result.deck };
        }

        const { card: extra, deck: newD } = result;
        delivered.push(extra);
        return { card: delivered, deck: newD };
    }

    return drawOnlyNumber(rest);
}

export function addCardIfNotExists(deck: CardData[], newCard: CardData | CardData[]): void {
    const cardsToAdd = Array.isArray(newCard) ? newCard : [newCard];

    for (const card of cardsToAdd) {
        const exists = deck.some(existingCard => existingCard.id === card.id);
        if (!exists) {
            deck.push(card);
        }
    }
}