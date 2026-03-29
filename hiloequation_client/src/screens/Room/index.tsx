import { useState } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import styles from './Room.module.css';
import { Deck, Player } from '@/components';
import { createDeck, shuffleDeck, deliverRound1, deliverRound2 } from '@/utils/deck';
import { DEFAULT_OPERATION_CARDS } from '@/types/card';
import type { CardData } from '@/types/card';

export const Room = () => {
  const [deckCards, setDeckCards] = useState<CardData[]>(() => shuffleDeck(createDeck()));
  const [playerCards, setPlayerCards] = useState<CardData[]>(DEFAULT_OPERATION_CARDS);
  const [deliveryCount, setDeliveryCount] = useState(0);

  const handleCardDelivery = () => {
    // If player already has 4 Number Cards, no more deliveries allowed
    const numberCardCount = playerCards.filter((c) => c.type === 'number').length;
    if (numberCardCount >= 4) return;

    const round = deliveryCount + 1; // 1, 2, 3, 4...
    const isRound2 = round % 2 === 0; // 2nd, 4th... click

    const { delivered, deck: newDeck } = isRound2
      ? deliverRound2(deckCards)
      : deliverRound1(deckCards);

    setDeckCards(newDeck);
    setPlayerCards((prev) => [...prev, ...delivered]);
    setDeliveryCount(round);
  };

  return (
    <DragDropProvider
      onDragMove={(event) => {
        console.log('event', event)
      }}
      onDragEnd={(event) => {
        if (event.canceled) return;
        const sourceId = event.operation.source?.id as string;
        const targetId = event.operation.target?.id as string;

        if (!sourceId || !targetId || sourceId === targetId) return;

        const sourceInPlayer = playerCards.some((c) => c.id === sourceId);
        const targetInPlayer = playerCards.some((c) => c.id === targetId);

        // Reorder within player area
        if (sourceInPlayer && targetInPlayer) {
          setPlayerCards((prev) => {
            const next = [...prev];
            const fromIdx = next.findIndex((c) => c.id === sourceId);
            const toIdx = next.findIndex((c) => c.id === targetId);
            const [moved] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, moved);
            return next;
          });
        }
      }}
    >
      <div className={styles.container}>
        <button
          onClick={handleCardDelivery}
          disabled={deckCards.length === 0 || playerCards.filter((c) => c.type === 'number').length >= 4}
          className={styles.cardDeliveryBtn}
        >
          Card Delivery {deliveryCount === 0 ? '' : `(Round ${deliveryCount + 1})`}
        </button>
        <Deck
          cards={deckCards}
          onShuffle={() => {
            setDeckCards(shuffleDeck(createDeck()));
            setDeliveryCount(0);
          }}
        />
        <Player id="player" cards={playerCards} />
      </div>
    </DragDropProvider>
  );
};


