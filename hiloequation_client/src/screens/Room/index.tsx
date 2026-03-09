import React, { useState } from 'react';
import { type CardData } from '@/types/card';
import { Card } from '@/components';
import styles from './Room.module.css'
import { createDeck, shuffleDeck } from '@/utils/deck';

export const Room = () => {
  const [deck, setDeck] = useState<CardData[]>(() => shuffleDeck(createDeck()));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Deck ({deck.length} cards)</h2>
        <button
          className={styles.shuffleBtn}
          onClick={() => setDeck(shuffleDeck(createDeck()))}
        >
          Shuffle & Regenerate
        </button>
      </div>
      <div className={styles.grid}>
        {/* {deck.map((card) => (
          <Card key={card.id} card={card} />
        ))} */}
      </div>
    </div>
  )
}