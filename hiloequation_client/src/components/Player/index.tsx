import styles from './Player.module.css';
import { Card } from '@/components';

type PlayerProps = {
    id: string;
    additionalStyle?: string;
};
export const Player = ({ id, additionalStyle }: PlayerProps) => {
    return (
        <div className={`${styles.container} ${additionalStyle}`} >
            <div>{id}</div>
            <Card
                card={{ id: 'placeholder', type: 'number', suit: 'bronze', value: 0 }}
                faceDown={true}
                droppable={false}
            />
        </div>
    );
};


