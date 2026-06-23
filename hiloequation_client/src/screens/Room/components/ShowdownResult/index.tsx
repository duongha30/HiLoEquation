import styles from './ShowdownResult.module.css';
import { useAppSelector } from '@/store/hooks';
import { selectShowdownResult } from '@/store/selectors/game';
import type { ShowdownWinner } from '@/types/game';

const formatLine = (label: string, winner: ShowdownWinner) =>
    winner
        ? `${label}: ${winner.playerId} (${winner.result}) +${winner.amount} EUR`
        : `${label}: no winner`;

export const ShowdownResult = () => {
    const showdownResult = useAppSelector(selectShowdownResult);

    if (!showdownResult) return null;

    return (
        <div className={styles.container}>
            <span className={styles.title}>Showdown</span>
            <span className={styles.line}>{formatLine('Hi Pot', showdownResult.hiWinner)}</span>
            <span className={styles.line}>{formatLine('Lo Pot', showdownResult.loWinner)}</span>
        </div>
    );
};
