import styles from './MainPlayer.module.css';
import { useDroppable } from '@dnd-kit/react';
import { Card } from '@/components';
import type { CardData } from '@/types/card';
import { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/selectors/user';
import { selectRoomCode } from '@/store/selectors/room';
import { getSocket } from '@/store/socket/socket';
import { EMIT_BET_COIN, EMIT_FOLD_CARD } from '@/store/socket/events';
import { selectMyHand } from '@/store';

const BET_STEP = 10;

type MainPlayerProps = {
    id: string;
    cash: number;
    cards: CardData[];
    onCardMount?: (id: string, el: HTMLElement | null) => void;
    cardTranslates?: Record<string, number>;
};

export const MainPlayer = ({ id, cards, onCardMount, cardTranslates }: MainPlayerProps) => {
    const { ref } = useDroppable({ id });
    const [betAmount, setBetAmount] = useState(0);
    const playerId = useAppSelector(selectUserId);
    const roomCode = useAppSelector(selectRoomCode);
    const myHand = useAppSelector(selectMyHand);
    const cash = useMemo(() => myHand?.cash ?? 0, [myHand?.cash]);

    const handleIncrease = () => {
        setBetAmount((prev) => Math.min(prev + BET_STEP, cash));
    };

    const handleDecrease = () => {
        setBetAmount((prev) => Math.max(prev - BET_STEP, 0));
    };

    const handleBetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(0, Math.min(Number(e.target.value), cash));
        setBetAmount(val);
    };

    const handleBet = () => {
        if (betAmount <= 0 || betAmount > cash) return;
        getSocket()?.emit(EMIT_BET_COIN, { roomCode, playerId, betting: betAmount });
        setBetAmount(0);
    };

    const handleFold = () => {
        getSocket()?.emit(EMIT_FOLD_CARD, { roomCode, playerId });
    };

    return (
        <div ref={ref} className={styles.container}>
            <div className={styles.cashDisplay}>{cash} EUR</div>

            <div className={styles.cardArea}>
                {cards.map((card) => (
                    <Card key={card.id} card={card} droppable onMount={onCardMount} translateX={cardTranslates?.[card.id]} />
                ))}
            </div>

            <div className={styles.actions}>
                <button className={`${styles.btn} ${styles.foldBtn}`} onClick={handleFold}>
                    Fold
                </button>
                <div className={styles.betControls}>
                    <button className={styles.btn} onClick={handleDecrease} disabled={betAmount <= 0}>-</button>
                    <input
                        type="number"
                        className={styles.betInput}
                        value={betAmount}
                        min={0}
                        max={cash}
                        onChange={handleBetInput}
                    />
                    <button className={styles.btn} onClick={handleIncrease} disabled={betAmount >= cash}>+</button>
                </div>
                <button className={`${styles.btn} ${styles.betBtn}`} onClick={handleBet} disabled={betAmount <= 0}>
                    Bet
                </button>
            </div>
        </div>
    );
};


