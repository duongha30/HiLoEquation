import React, { useState } from 'react';
import { Card } from '@/components';
import { type CardData } from '@/types/card';
import styles from './Deck.module.css';
import { createDeck, shuffleDeck } from '@/utils/deck';

const MAX_VISIBLE = 5;

export const Deck = () => {
  const [deck, setDeck] = useState<CardData[]>(() => shuffleDeck(createDeck()));

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Deck ({deck.length} cards)</h2>
        <button
          className={styles.shuffleBtn}
          onClick={() => setDeck(shuffleDeck(createDeck()))}
        >
          Shuffle & Regenerate
        </button>
      </div>
      <div className={styles.stack}>
        {deck.slice(0, MAX_VISIBLE).map((card, i) => (
          <div
            key={card.id}
            className={styles.stackItem}
            style={{
              zIndex: MAX_VISIBLE - i,
              transform: `translate(${i * 3}px, ${i * -3}px)`,
            }}
          >
            <Card card={card} faceDown={true} />
          </div>
        ))}
      </div>
    </div>
  );
};

