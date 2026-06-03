import styles from './Player.module.css';
import { Card } from '@/components';
import { useAppSelector } from '@/store/hooks';
import { selectAllHands, selectCurrentTurnPlayerId } from '@/store';

type PlayerProps = {
    id: string;
    position: 'left' | 'top' | 'right';
    additionalStyle?: string;
};

const ROTATION = {
    left: styles.rotateLeft,
    top: styles.rotateTop,
    right: styles.rotateRight,
};

export const Player = ({ id, position, additionalStyle }: PlayerProps) => {
    const hand = useAppSelector(selectAllHands)[id];
    const currentTurnPlayerId = useAppSelector(selectCurrentTurnPlayerId);
    const allCards = hand?.cards ?? [];
    const normalizedCards = allCards.map((c, i) => ({ ...c, id: c.id ?? `face-down-${i}` }));
    const isCurrentTurn = currentTurnPlayerId === id;

    return (
        <div className={`${styles.container} ${additionalStyle ?? ''} ${isCurrentTurn ? styles.activeTurn : ''}`}>
            <div className={`${styles.cardsGroup} ${ROTATION[position]}`}>
                {normalizedCards.map(c => (
                    <div key={c.id} className={styles.cardWrapper}>
                        <Card card={c} faceDown={!!c.encryptedData} droppable={false} />
                    </div>
                ))}
            </div>
        </div>
    );
};
