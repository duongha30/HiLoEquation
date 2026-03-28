import React, { useState } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import styles from './Room.module.css';
import { Deck, Player } from '@/components';
import { createDeck, shuffleDeck } from '@/utils/deck';
import { DEFAULT_OPERATION_CARDS } from '@/types/card';
import type { CardData } from '@/types/card';

export const Room = () => {
  const [deckCards, setDeckCards] = useState<CardData[]>(() => shuffleDeck(createDeck()));
  const [playerCards, setPlayerCards] = useState<CardData[]>(DEFAULT_OPERATION_CARDS);

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;
        const sourceId = event.operation.source?.id as string;
        const targetId = event.operation.target?.id as string;
        console.log('sourceId', sourceId)
        console.log('targetId', targetId)

        if (!sourceId || !targetId || sourceId === targetId) return;

        const sourceInPlayer = playerCards.some((c) => c.id === sourceId);
        const targetInPlayer = playerCards.some((c) => c.id === targetId);

        // Reorder within player area
        if (sourceInPlayer && targetInPlayer) {
          setPlayerCards((prev) => {
            const next = [...prev];
            console.log('next', next)
            const fromIdx = next.findIndex((c) => c.id === sourceId);
            const toIdx = next.findIndex((c) => c.id === targetId);
            const [moved] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, moved);
            return next;
          });
          return;
        }

        // Drag from deck to player
        // if (!sourceInPlayer && targetId === 'player') {
        //   const card = deckCards.find((c) => c.id === sourceId);
        //   if (card) {
        //     setDeckCards((prev) => prev.filter((c) => c.id !== sourceId));
        //     setPlayerCards((prev) => [...prev, card]);
        //   }
        //   return;
        // }
      }}
    >
      <div className={styles.container}>
        <Deck
          cards={deckCards}
          onShuffle={() => setDeckCards(shuffleDeck(createDeck()))}
        />
        <Player id="player" cards={playerCards} />
      </div>
    </DragDropProvider>
  );
};
