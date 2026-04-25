import { useEffect, useRef } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import styles from './Room.module.css';
import { Deck, Host, Player } from '@/components';
import { useRoomSubscription } from '@/hooks';
import { useDrapDrop } from './useDragDrop';
import { useRoomStore } from './roomStore';
import { useAppSelector } from '@/store/hooks';
import { selectAllGuess } from '@/store';

export const Room = () => {
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const players = useAppSelector(selectAllGuess);
  const { deckCards, playerCards, deliveryCount, activeId, cardTranslates, resetDeck } = useRoomStore();
  const playerCardsRef = useRef(playerCards);
  useRoomSubscription();
  const {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleCardDelivery,
  } = useDrapDrop(playerCardsRef, cardRefs);
  useEffect(() => { playerCardsRef.current = playerCards; }, [playerCards]);

  const PLAYER_POSITION_STYLES = [styles.playerLeft, styles.playerTop, styles.playerRight];

  const renderPlayer = () => {
    return players.map((p, i) => (
      <Player key={p} id={p} additionalStyle={PLAYER_POSITION_STYLES[i % 3]} />
    ));
  }

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.container}>
        <div className={styles.deckSection}>
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
            onShuffle={resetDeck}
          />
        </div>
        <Host
          id="host-player"
          cards={playerCards}
          onCardMount={(id, el) => {
            if (el) cardRefs.current.set(id, el);
            else cardRefs.current.delete(id);
          }}
          cardTranslates={cardTranslates}
        />
        {renderPlayer()}
      </div>
    </DragDropProvider>
  );
};

