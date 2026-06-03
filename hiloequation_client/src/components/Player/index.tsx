import styles from './Player.module.css';
import { Card } from '@/components';
import { useAppSelector } from '@/store/hooks';
import { selectAllHands } from '@/store';

type PlayerProps = {
    id: string;
    additionalStyle?: string;
};

export const Player = ({ id, additionalStyle }: PlayerProps) => {
    const hand = useAppSelector(selectAllHands)[id];
    const visibleCards = hand?.cards?.filter(c => !c.faceDown) ?? [];

    return (
        <div className={`${styles.container} ${additionalStyle}`}>
            <div>{id}</div>
            {visibleCards.map(c => (
                <Card key={c.id} card={c} faceDown droppable={false} />
            ))}
        </div>
    );
};
