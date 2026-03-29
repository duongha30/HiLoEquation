import { useEffect, useRef, useState } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/react';
import styles from './Room.module.css';
import { Deck, Player } from '@/components';
import { createDeck, shuffleDeck, deliverRound1, deliverRound2 } from '@/utils/deck';
import { DEFAULT_OPERATION_CARDS } from '@/types/card';
import type { CardData } from '@/types/card';

export const Room = () => {
  const [deckCards, setDeckCards] = useState<CardData[]>(() => shuffleDeck(createDeck()));
  const [playerCards, setPlayerCards] = useState<CardData[]>(DEFAULT_OPERATION_CARDS);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cardTranslates, setCardTranslates] = useState<Record<string, number>>({});

  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const snapRects = useRef<Map<string, DOMRect>>(new Map()); // Snapshotted rects of all player cards at the moment drag starts
  const insertAtRef = useRef<number>(0); // Tracks where the dragged card would land if dropped right now
  const playerCardsRef = useRef(playerCards);
  useEffect(() => { playerCardsRef.current = playerCards; }, [playerCards]);

  const handleDragStart = (event: DragStartEvent) => {
    const sourceId = event.operation.source?.id as string;
    if (!sourceId) return;

    // Snapshot rects of all player cards before any transform is applied
    const snap = new Map<string, DOMRect>();
    playerCardsRef.current.forEach((card) => {
      const el = cardRefs.current.get(card.id);
      if (el) snap.set(card.id, el.getBoundingClientRect());
    });
    snapRects.current = snap;
    insertAtRef.current = playerCardsRef.current.findIndex((c) => c.id === sourceId);
    setActiveId(sourceId);
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const sourceId = event.operation.source?.id as string;
    if (!sourceId) return;

    // boundingRectangle of the dragged card at its current visual (translated) position
    const currentShape = event.operation.shape?.current?.boundingRectangle;
    if (!currentShape) return;

    const cards = playerCardsRef.current;
    const origIdx = cards.findIndex((c) => c.id === sourceId);
    if (origIdx === -1) return;

    const draggedLeft = currentShape.left;
    const draggedRight = draggedLeft + currentShape.width;

    // Find the non-dragged card whose width is overlapped >= 40% by the dragged card
    let newInsertIdx = origIdx;
    let maxRatio = 0;

    cards.forEach((card, i) => {
      if (card.id === sourceId) return;
      const rect = snapRects.current.get(card.id);
      if (!rect) return;

      const overlapLeft = Math.max(draggedLeft, rect.left);
      const overlapRight = Math.min(draggedRight, rect.right);
      const overlap = Math.max(0, overlapRight - overlapLeft);
      const ratio = overlap / rect.width;

      if (ratio >= 0.4 && ratio > maxRatio) {
        maxRatio = ratio;
        newInsertIdx = i;
      }
    });

    insertAtRef.current = newInsertIdx;

    // Compute translateX offsets so each displaced card slides into the correct slot
    const newTranslates: Record<string, number> = {};

    cards.forEach((card, i) => {
      if (card.id === sourceId) return;
      const rect = snapRects.current.get(card.id);
      if (!rect) return;

      let shift = 0;

      if (newInsertIdx > origIdx && i > origIdx && i <= newInsertIdx) {
        // A moved right → these cards shift left one slot each
        const prevRect = snapRects.current.get(cards[i - 1].id);
        if (prevRect) shift = prevRect.left - rect.left;
      } else if (newInsertIdx < origIdx && i >= newInsertIdx && i < origIdx) {
        // A moved left → these cards shift right one slot each
        const nextRect = snapRects.current.get(cards[i + 1].id);
        if (nextRect) shift = nextRect.left - rect.left;
      }

      if (shift !== 0) newTranslates[card.id] = shift;
    });

    setCardTranslates(newTranslates);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setCardTranslates({});
    snapRects.current = new Map();

    if (event.canceled) return;

    const sourceId = event.operation.source?.id as string;
    if (!sourceId) return;

    const insertAt = insertAtRef.current;
    setPlayerCards((prev) => {
      const origIdx = prev.findIndex((c) => c.id === sourceId);
      if (origIdx === -1 || origIdx === insertAt) return prev;
      const next = [...prev];
      const [moved] = next.splice(origIdx, 1);
      next.splice(insertAt, 0, moved);
      return next;
    });
  };

  const handleCardDelivery = () => {
    const numberCardCount = playerCards.filter((c) => c.type === 'number').length;
    if (numberCardCount >= 4) return;

    const round = deliveryCount + 1;
    const isRound2 = round % 2 === 0;

    const { delivered, deck: newDeck } = isRound2
      ? deliverRound2(deckCards)
      : deliverRound1(deckCards);

    setDeckCards(newDeck);
    setPlayerCards((prev) => [...prev, ...delivered]);
    setDeliveryCount(round);
  };

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.container}>
        <button
          onClick={handleCardDelivery}
          disabled={
            !!activeId ||
            deckCards.length === 0 ||
            playerCards.filter((c) => c.type === 'number').length >= 4
          }
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
        <Player
          id="player"
          cards={playerCards}
          onCardMount={(id, el) => {
            if (el) cardRefs.current.set(id, el);
            else cardRefs.current.delete(id);
          }}
          cardTranslates={cardTranslates}
        />
      </div>
    </DragDropProvider>
  );
};

