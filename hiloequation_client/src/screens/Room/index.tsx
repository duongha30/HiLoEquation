import React, { useState } from 'react';
import styles from './Room.module.css'
import { Deck, Player } from '@/components';
import { DragDropProvider } from '@dnd-kit/react';

export const Room = () => {
  const [isDropped, setIsDropped] = useState(false);

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { target } = event.operation;
        setIsDropped(target?.id === 'droppable');
      }}
    >
      <div className={styles.container}>
        {!isDropped && <Deck />}

        <Player id="droppable">
          {isDropped && <Deck />}
        </Player>
      </div>
    </DragDropProvider>
  );
}