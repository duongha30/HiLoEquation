import styles from './ShowdownResult.module.css';
import { useAppSelector } from '@/store/hooks';
import { selectShowdownResult, selectRevealedHands } from '@/store/selectors/game';
import { selectAllPlayers, selectPlayerNames } from '@/store';

const formatResults = (
    potSelection: string | null | undefined,
    hi: number | undefined,
    lo: number | undefined,
): string => {
    if (potSelection === 'hi') return `Hi ${hi ?? '—'}`;
    if (potSelection === 'lo') return `Lo ${lo ?? '—'}`;
    if (potSelection === 'swing') return `Hi ${hi ?? '—'} / Lo ${lo ?? '—'}`;
    return '—';
};

export const ShowdownResult = () => {
    const showdownResult = useAppSelector(selectShowdownResult);
    const revealedHands = useAppSelector(selectRevealedHands);
    const players = useAppSelector(selectAllPlayers);
    const playerNames = useAppSelector(selectPlayerNames);

    if (!showdownResult) return null;

    const { hiWinner, loWinner } = showdownResult;

    return (
        <div className={styles.container}>
            <span className={styles.title}>Showdown</span>
            {players.map((id) => {
                const revealed = revealedHands[id];
                const name = playerNames[id] ?? id.slice(0, 8);
                const results = formatResults(revealed?.potSelection, revealed?.hiSubmission?.result, revealed?.loSubmission?.result);

                const wins: string[] = [];
                if (hiWinner?.playerId === id) wins.push(`WON Hi +${hiWinner.amount} EUR`);
                if (loWinner?.playerId === id) wins.push(`WON Lo +${loWinner.amount} EUR`);
                const isWinner = wins.length > 0;

                return (
                    <div key={id} className={`${styles.row} ${isWinner ? styles.winnerRow : ''}`}>
                        <span className={styles.name}>{name}</span>
                        <span className={styles.result}>{results}</span>
                        {isWinner && <span className={styles.win}>★ {wins.join(' · ')}</span>}
                    </div>
                );
            })}
        </div>
    );
};
