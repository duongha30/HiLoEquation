import styles from './Card.module.css';
import type { CardData } from '../../types/card';

type CardProps = {
  number: number;
  faceDown?: boolean;
};

const SUIT_LABEL: Record<string, string> = {
  gold: '♥',
  silver: '♦',
  bronze: '♠',
  black: '♣',
};

export const Card = ({ card, faceDown = false }: CardProps) => {
  const suitClass = styles[card.suit];
  const label =
    card.type === 'number'
      ? String(card.value)
      : card.type === 'sqrt'
      ? '√'
      : '×';

  return (
    <div className={`${styles.container} ${suitClass}`}>
      {faceDown ? (
        <div className={styles.faceDown} />
      ) : (
        <>
          <span className={`${styles.corner} ${styles.topLeft}`}>
            {SUIT_LABEL[card.suit]}
          </span>
          <span className={styles.centerLabel}>{label}</span>
          <span className={`${styles.corner} ${styles.bottomRight}`}>
            {SUIT_LABEL[card.suit]}
          </span>
        </>
      )}
    </div>
  );
};

