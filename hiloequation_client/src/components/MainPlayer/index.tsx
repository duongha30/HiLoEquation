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
import { selectMyHand, selectGameRound, selectIsPlaying, selectBettingRound, selectCurrentBet, selectIsMyTurn, setIsForcedBetPhase, setPotSelection } from '@/store';
import { selectIsForcedBetPhase, selectPotSelection } from '@/store/selectors/game';

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
    const potSelection = useAppSelector(selectPotSelection);

    const myContribution = bettingRound?.contributions[playerId ?? ''] ?? 0;
    const callAmount = Math.max(0, currentBet - myContribution);
    const canCheck = isMyTurn && callAmount === 0;

    useEffect(() => {
        if (isPlaying && round === 0 && (myHand?.bet ?? 0) === 0) {
            const timer = setTimeout(() => dispatch(setIsForcedBetPhase(true)), MODEL_DISPLAY_TIME);
            return () => clearTimeout(timer);
        }
    }, [isPlaying, round, myHand]);

    useEffect(() => {
        if (round === 0) {
            dispatch(setPotSelection(null));
        }
    }, [round]);

    const handleIncrease = () => {
        setBetAmount((prev) => Math.min(prev + BET_STEP, cash));
    };

    const handleDecrease = () => {
        setBetAmount((prev) => Math.max(prev - BET_STEP, isForcedBetPhase ? MIN_FORCED_BET : 0));
    };

    const handleBetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(MIN_FORCED_BET, Math.min(Number(e.target.value), cash));
        setBetAmount(val);
    };

    const handleBet = (isFirstBet: boolean = false) => {
        console.log('handleBet')
        getSocket()?.emit(EMIT_BET_COIN, { roomCode, playerId, betting: MIN_FORCED_BET, isFirstBet });
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

    const handlePotSelection = (selection: 'hi' | 'lo' | 'swing') => {
        dispatch(setPotSelection(selection));
    };

    return (
        <div ref={ref} className={styles.container}>
            {isForcedBetPhase && (
                <div className={styles.overlay}>
                    <div className={styles.forcedBetModal}>
                        <h2 className={styles.forcedBetTitle}>First Bet Required</h2>
                        <p className={styles.forcedBetDesc}>
                            You must place a 50 bet before the next cards are dealt.
                            <br />
                            BET: <strong>50 EUR</strong>
                        </p>
                        <div className={styles.betControls}>
                            <input
                                type="number"
                                className={styles.betInput}
                                value={MIN_FORCED_BET}
                                min={MIN_FORCED_BET}
                                max={cash}
                                onChange={handleBetInput}
                            />
                        </div>
                        <button
                            className={`${styles.btn} ${styles.betBtn}`}
                            onClick={() => handleBet(true)}
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

            {isPlaying && round === 4 && (
                <div className={styles.potSelectionPanel}>
                    <span className={styles.bettingRoundLabel}>Declare your pot</span>
                    <div className={styles.actions}>
                        <button
                            className={`${styles.btn} ${styles.potBtn} ${potSelection === 'hi' ? styles.potBtnActive : ''}`}
                            onClick={() => handlePotSelection('hi')}
                        >
                            Hi Pot
                        </button>
                        <button
                            className={`${styles.btn} ${styles.potBtn} ${potSelection === 'lo' ? styles.potBtnActive : ''}`}
                            onClick={() => handlePotSelection('lo')}
                        >
                            Lo Pot
                        </button>
                        <button
                            className={`${styles.btn} ${styles.potBtn} ${potSelection === 'swing' ? styles.potBtnActive : ''}`}
                            onClick={() => handlePotSelection('swing')}
                        >
                            Swing
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


