import React from 'react';
import { Card } from '@/components';
import styles from './Deck.module.css';
import { DEFAULT_OPERATION_CARDS } from '@/types/card';

const MAX_VISIBLE = 5;


export const Deck = () => {
  const cards = DEFAULT_OPERATION_CARDS;
  return (
    <div>
      <div className={styles.stack}>
        {cards.slice(0).map((card, i) => (
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

