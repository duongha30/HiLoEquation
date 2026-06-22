import { useEffect, useState } from 'react';
import styles from './DeclareTimer.module.css';
import { useAppSelector } from '@/store/hooks';
import { selectDeclareDeadlineAt, selectGameRound } from '@/store/selectors/game';

export const DeclareTimer = () => {
    const deadlineAt = useAppSelector(selectDeclareDeadlineAt);
    const round = useAppSelector(selectGameRound);
    const [remainingMs, setRemainingMs] = useState(0);

    useEffect(() => {
        if (!deadlineAt) return;
        const tick = () => setRemainingMs(Math.max(0, deadlineAt - Date.now()));
        tick();
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [deadlineAt]);

    if (round !== 4 || !deadlineAt) return null;

    const seconds = Math.ceil(remainingMs / 1000);

    return (
        <div className={styles.container}>
            <span className={styles.label}>Declare & submit</span>
            <span className={styles.time}>{seconds}s</span>
        </div>
    );
};
