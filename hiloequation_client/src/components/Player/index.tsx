import styles from './Player.module.css';
import { useDroppable } from '@dnd-kit/react';
import { Card } from '@/components';
import type { CardData } from '@/types/card';

type PlayerProps = {
    id: string;
    cards: CardData[];
    onCardMount?: (id: string, el: HTMLElement | null) => void;
    cardTranslates?: Record<string, number>;
};

export const Player = ({ id, cards, onCardMount, cardTranslates }: PlayerProps) => {
    const { ref } = useDroppable({ id });

    return (
        <div ref={ref} className={styles.container}>
            {cards.map((card) => (
                <Card key={card.id} card={card} droppable onMount={onCardMount} translateX={cardTranslates?.[card.id]} />
            ))}
        </div>
    );
};


