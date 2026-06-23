import styles from './BettingDisplay.module.css';
import { useAppSelector } from '@/store/hooks';
import { selectAllHands, selectAllPlayers, selectIsPlaying, selectPlayerNames } from '@/store';

export const BettingDisplay = () => {
    const isPlaying = useAppSelector(selectIsPlaying);
    const players = useAppSelector(selectAllPlayers);
    const allHands = useAppSelector(selectAllHands);
    const playerNames = useAppSelector(selectPlayerNames);

    if (!isPlaying) return null;

    return (
        <div className={styles.container}>
            {players.map((id) => {
                const bet = allHands[id]?.bet ?? 0;
                return (
                    <div key={id} className={styles.row}>
                        <span className={styles.playerId}>{playerNames[id] ?? id.slice(0, 8)}</span>
                        <span className={styles.betAmount}>{bet} EUR</span>
                    </div>
                );
            })}
        </div>
    );
};
