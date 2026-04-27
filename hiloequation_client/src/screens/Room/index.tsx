import { useEffect, useRef } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import styles from './Room.module.css';
import { Deck, MainPlayer, Player } from '@/components';
import { useRoomSubscription } from '@/hooks';
import { useDrapDrop } from './useDragDrop';
import { useRoomStore } from './roomStore';
import { useAppSelector } from '@/store/hooks';
import { isHostPlayer, selectAllGuess, selectRoomId, selectAllPlayers } from '@/store';
import { selectUserId } from '@/store/selectors/user';
import { EMIT_START_GAME, EMIT_PLAYER_READY } from '@/store/socket/events';
import { getSocket } from '@/store/socket/socket';

export const Room = () => {
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const guess = useAppSelector(selectAllGuess);
  const isHost = useAppSelector(isHostPlayer);
  const roomId = useAppSelector(selectRoomId);
  const players = useAppSelector(selectAllPlayers);
  const userId = useAppSelector(selectUserId);
  const { deckCards, playerCards, deliveryCount, activeId, cardTranslates, resetDeck, readyPlayers, setPlayerReady } = useRoomStore();
  const playerCardsRef = useRef(playerCards);
  useRoomSubscription();
  const {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleCardDelivery,
  } = useDrapDrop(playerCardsRef, cardRefs);
  useEffect(() => { playerCardsRef.current = playerCards; }, [playerCards]);

  const handleStartGame = () => {
    getSocket()?.emit(EMIT_START_GAME, { roomId, players });
  };

  const isReady = readyPlayers.includes(userId ?? '');
  const allGuestsReady = guess.length > 0 && guess.every((id) => readyPlayers.includes(id));

  const handleToggleReady = () => {
    const next = !isReady;
    setPlayerReady(userId ?? '', next);
    getSocket()?.emit(EMIT_PLAYER_READY, { roomCode: roomId, playerId: userId, isReady: next });
  };

  const PLAYER_POSITION_STYLES = [styles.playerLeft, styles.playerTop, styles.playerRight];

  const renderPlayer = () => {
    return guess.map((p, i) => (
      <Player key={p} id={p} additionalStyle={PLAYER_POSITION_STYLES[i % 3]} />
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
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!allGuestsReady || deliveryCount > 0}
              className={styles.cardDeliveryBtn}
            >
              Start Game!
            </button>
          ) : (
            <button
              onClick={handleToggleReady}
              className={`${styles.cardDeliveryBtn} ${isReady ? styles.readyActive : ''}`}
            >
              {isReady ? 'Cancel Ready' : 'Ready'}
            </button>
          )}
          <Deck
            cards={deckCards}
            onShuffle={resetDeck}
          />
        </div>
        <MainPlayer
          id="main-player"
          cash={0}
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

