import React from 'react';
import styles from './Player.module.css';
import { useDroppable } from '@dnd-kit/react';
import { Card } from '@/components';
import type { CardData } from '@/types/card';

type PlayerProps = {
    id: string;
    cards: CardData[];
};

export const Player = ({ id, cards }: PlayerProps) => {
    const { ref } = useDroppable({ id });

    return (
        <div ref={ref} className={styles.container}>
            {cards.map((card) => (
                <Card key={card.id} card={card} droppable />
            ))}
        </div>
    );
};


