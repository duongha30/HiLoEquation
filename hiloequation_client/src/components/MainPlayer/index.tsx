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
import { selectMyHand, selectGameRound, selectIsPlaying } from '@/store';

const BET_STEP = 10;
const MIN_FORCED_BET = 50;

type MainPlayerProps = {
    id: string;
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
    const round = useAppSelector(selectGameRound);
    const isPlaying = useAppSelector(selectIsPlaying);
    const cash = useMemo(() => myHand?.cash ?? 0, [myHand?.cash]);

    const isForcedBetPhase = isPlaying && round === 2 && (myHand?.bet ?? 0) === 0;
    const minBet = isForcedBetPhase ? MIN_FORCED_BET : 1;

    const handleIncrease = () => {
        setBetAmount((prev) => Math.min(prev + BET_STEP, cash));
    };

    const handleDecrease = () => {
        setBetAmount((prev) => Math.max(prev - BET_STEP, isForcedBetPhase ? MIN_FORCED_BET : 0));
    };

    const handleBetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(minBet, Math.min(Number(e.target.value), cash));
        setBetAmount(val);
    };

    const handleBet = () => {
        if (betAmount < minBet || betAmount > cash) return;
        getSocket()?.emit(EMIT_BET_COIN, { roomCode, playerId, betting: betAmount });
        setBetAmount(0);
    };

    const handleFold = () => {
        getSocket()?.emit(EMIT_FOLD_CARD, { roomCode, playerId });
    };

    return (
        <div ref={ref} className={styles.container}>
            {isForcedBetPhase && (
                <div className={styles.overlay}>
                    <div className={styles.forcedBetModal}>
                        <h2 className={styles.forcedBetTitle}>First Bet Required</h2>
                        <p className={styles.forcedBetDesc}>
                            You must place a bet before the next cards are dealt.
                            <br />
                            Minimum: <strong>50 EUR</strong>
                        </p>
                        <div className={styles.betControls}>
                            <button className={styles.btn} onClick={handleDecrease} disabled={betAmount <= minBet}>-</button>
                            <input
                                type="number"
                                className={styles.betInput}
                                value={betAmount}
                                min={minBet}
                                max={cash}
                                onChange={handleBetInput}
                            />
                            <button className={styles.btn} onClick={handleIncrease} disabled={betAmount >= cash}>+</button>
                        </div>
                        <button
                            className={`${styles.btn} ${styles.betBtn}`}
                            onClick={handleBet}
                            disabled={betAmount < minBet}
                        >
                            Bet
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.cashDisplay}>{cash} EUR</div>

            <div className={styles.cardArea}>
                {cards.map((card) => (
                    <Card key={card.id} card={card} faceDown={card.faceDown ?? false} droppable draggable onMount={onCardMount} translateX={cardTranslates?.[card.id]} />
                ))}
            </div>

            {!isForcedBetPhase && (
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
                            min={1}
                            max={cash}
                            onChange={handleBetInput}
                        />
                        <button className={styles.btn} onClick={handleIncrease} disabled={betAmount >= cash}>+</button>
                    </div>
                    <button className={`${styles.btn} ${styles.betBtn}`} onClick={handleBet} disabled={betAmount <= 0}>
                        Bet
                    </button>
                </div>
            )}
        </div>
    );
};


