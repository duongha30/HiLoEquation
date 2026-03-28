import { useDraggable, useDroppable } from '@dnd-kit/react';
import styles from './Card.module.css';
import type { CardData } from '../../types/card';

type CardProps = {
  card: CardData;
  faceDown?: boolean;
  droppable?: boolean;
};

const SUIT_LABEL: Record<string, string> = {
  gold: '♥',
  silver: '♦',
  bronze: '♠',
  black: '♣',
};

export const Card = ({ card, faceDown = false, droppable = false }: CardProps) => {
  const { ref: dragRef, isDragging } = useDraggable({ id: card.id });
  const { ref: dropRef } = useDroppable({ id: card.id, disabled: !droppable });

  const suitClass = card.suit ? styles[card.suit] : styles.operation;
  const label =
    card.type === 'number'
      ? String(card.value)
      : card.type === 'sqrt'
        ? '√'
        : card.type === 'multiply'
          ? '×'
          : (card.operation ?? '');

  return (
    <div
      ref={(node) => { dragRef(node); dropRef(node); }}
      className={`${styles.container} ${suitClass}`}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        opacity: isDragging ? 0.9 : 1,
        transition: 'outline 0.1s',
      }}
    >
      {faceDown ? (
        <div className={styles.faceDown} />
      ) : (
        <>
          {card.suit && (
            <span className={`${styles.corner} ${styles.topLeft}`}>
              {SUIT_LABEL[card.suit]}
            </span>
          )}
          <span className={styles.centerLabel}>{label}</span>
          {card.suit && (
            <span className={`${styles.corner} ${styles.bottomRight}`}>
              {SUIT_LABEL[card.suit]}
            </span>
          )}
        </>
      )}
    </div>
  );
};
