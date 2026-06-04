import styles from './MainPlayer.module.css';
import { useDroppable } from '@dnd-kit/react';
import { Card } from '@/components';
import type { CardData } from '@/types/card';
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/selectors/user';
import { selectRoomCode } from '@/store/selectors/room';
import { getSocket } from '@/store/socket/socket';
import { EMIT_BET_COIN, EMIT_FOLD_CARD, EMIT_PLAYER_ACTION } from '@/store/socket/events';
import { selectMyHand, selectGameRound, selectIsPlaying, selectBettingRound, selectCurrentBet, selectIsMyTurn, setIsForcedBetPhase } from '@/store';
import { selectIsForcedBetPhase } from '@/store/selectors/game';

const BET_STEP = 10;
const MIN_FORCED_BET = 50;
const MODEL_DISPLAY_TIME = 2000;

type MainPlayerProps = {
    id: string;
    cards: CardData[];
    onCardMount?: (id: string, el: HTMLElement | null) => void;
    cardTranslates?: Record<string, number>;
};

export const MainPlayer = ({ id, cards, onCardMount, cardTranslates }: MainPlayerProps) => {
    const { ref } = useDroppable({ id });
    const dispatch = useAppDispatch();
    const [betAmount, setBetAmount] = useState(0);
    const playerId = useAppSelector(selectUserId);
    const roomCode = useAppSelector(selectRoomCode);
    const myHand = useAppSelector(selectMyHand);
    const round = useAppSelector(selectGameRound);
    const isPlaying = useAppSelector(selectIsPlaying);
    const cash = useMemo(() => myHand?.cash ?? 0, [myHand?.cash]);

    const bettingRound = useAppSelector(selectBettingRound);
    const currentBet = useAppSelector(selectCurrentBet);
    const isMyTurn = useAppSelector(selectIsMyTurn);
    const isForcedBetPhase = useAppSelector(selectIsForcedBetPhase);

    const minBet = isForcedBetPhase ? MIN_FORCED_BET : 1;

    const myContribution = bettingRound?.contributions[playerId ?? ''] ?? 0;
    const callAmount = Math.max(0, currentBet - myContribution);
    const canCheck = isMyTurn && callAmount === 0;

    useEffect(() => {
        if (isPlaying && round === 0 && (myHand?.bet ?? 0) === 0) {
            const timer = setTimeout(() => dispatch(setIsForcedBetPhase(true)), MODEL_DISPLAY_TIME);
            return () => clearTimeout(timer);
        }
    }, [isPlaying, round, myHand]);

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

    const handleBet = (isFirstBet: boolean = false) => {
        if (betAmount < minBet || betAmount > cash) return;
        getSocket()?.emit(EMIT_BET_COIN, { roomCode, playerId, betting: betAmount, isFirstBet });
        setBetAmount(0);
    };

    const handleFold = () => {
        getSocket()?.emit(EMIT_FOLD_CARD, { roomCode, playerId });
    };

    const handleCheck = () => {
        getSocket()?.emit(EMIT_PLAYER_ACTION, { roomCode, playerId, action: 'check' });
    };

    const handleRoundBet = () => {
        if (betAmount < callAmount || betAmount > cash) return;
        getSocket()?.emit(EMIT_PLAYER_ACTION, { roomCode, playerId, action: 'bet', amount: betAmount });
        setBetAmount(0);
    };

    const handleRoundFold = () => {
        getSocket()?.emit(EMIT_PLAYER_ACTION, { roomCode, playerId, action: 'fold' });
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
                            onClick={() => handleBet(true)}
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

            {!isForcedBetPhase && !isMyTurn && null}

            {isMyTurn && (
                <div className={styles.bettingRoundPanel}>
                    <span className={styles.bettingRoundLabel}>
                        {canCheck ? 'Your turn — Check, Bet, or Fold' : `Your turn — Call ${callAmount} EUR, Raise, or Fold`}
                    </span>
                    <div className={styles.actions}>
                        {canCheck && (
                            <button className={styles.btn} onClick={handleCheck}>Check</button>
                        )}
                        <div className={styles.betControls}>
                            <button className={styles.btn} onClick={handleDecrease} disabled={betAmount <= Math.max(callAmount, 1)}>-</button>
                            <input
                                type="number"
                                className={styles.betInput}
                                value={betAmount}
                                min={callAmount}
                                max={cash}
                                onChange={handleBetInput}
                            />
                            <button className={styles.btn} onClick={handleIncrease} disabled={betAmount >= cash}>+</button>
                        </div>
                        <button className={`${styles.btn} ${styles.betBtn}`} onClick={handleRoundBet} disabled={betAmount < callAmount}>
                            {callAmount > 0 && betAmount === callAmount ? `Call ${callAmount}` : 'Bet'}
                        </button>
                        <button className={`${styles.btn} ${styles.foldBtn}`} onClick={handleRoundFold}>Fold</button>
                    </div>
                </div>
            )}
        </div>
    );
};


