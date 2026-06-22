import { useEffect, useMemo, useRef } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import styles from './Room.module.css';
import { Deck, MainPlayer, Player } from '@/components';
import { useRoomSubscription } from './hooks/useRoomSubscription';
import { useDrapDrop } from './hooks/useDragDrop';
import { useRoomStore } from './roomStore';
import { useAppSelector } from '@/store/hooks';
import { selectAllGuess, selectMyHand } from '@/store';
import { StartReadyButton, BettingDisplay, DeclareTimer } from './components/';
import { useRoomEmitting } from './hooks/useRoomEmitting';

export const Room = () => {
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const guess = useAppSelector(selectAllGuess);
  const myHand = useAppSelector(selectMyHand);

  const playerCards = useMemo(() => myHand?.cards ?? [], [myHand?.cards]);
  const { cardTranslates } = useRoomStore();
  const playerCardsRef = useRef(playerCards);

  useRoomSubscription();
  useRoomEmitting();

  const {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  } = useDrapDrop(playerCardsRef, cardRefs);

  useEffect(() => { playerCardsRef.current = playerCards; }, [playerCards]);

  const PLAYER_POSITION_STYLES = [styles.playerLeft, styles.playerTop, styles.playerRight];
  const PLAYER_POSITIONS: Array<'left' | 'top' | 'right'> = ['left', 'top', 'right'];

  const renderPlayer = () => {
    return guess.map((p, i) => (
      <Player key={p} id={p} position={PLAYER_POSITIONS[i % 3]} additionalStyle={PLAYER_POSITION_STYLES[i % 3]} />
    ));
  };

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.container}>
        <div className={styles.deckSection}>
          <StartReadyButton />
          <BettingDisplay />
          <DeclareTimer />
          <Deck />
        </div>
        <MainPlayer
          id="main-player"
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

