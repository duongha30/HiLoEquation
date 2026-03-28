import React from 'react';
import styles from './Room.module.css'
import { Deck } from '@/components/Deck';

export const Room = () => {
  return (
    <div className={styles.container}>
      <Deck />
    </div>
  )
}