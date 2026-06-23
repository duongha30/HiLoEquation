import styles from './MainPlayer.module.css';
import { useDroppable } from '@dnd-kit/react';
import { Card } from '@/components';
import type { CardData } from '@/types/card';
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/selectors/user';
import { selectRoomCode } from '@/store/selectors/room';
import { getSocket } from '@/store/socket/socket';
import { EMIT_BET_COIN, EMIT_FOLD_CARD, EMIT_PLAYER_ACTION, EMIT_DECLARE_POT, EMIT_SUBMIT_EQUATION } from '@/store/socket/events';
import { selectMyHand, selectGameRound, selectIsPlaying, selectBettingRound, selectCurrentBet, selectIsMyTurn, setIsForcedBetPhase } from '@/store';
import { selectIsForcedBetPhase, selectMyPotSelection, selectMyRevealedHand } from '@/store/selectors/game';
import { scanningCard } from '@/utils/scanningCard';

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
    const [enableFirstBet, setEnableFirstBet] = useState(true);
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
    const myPotSelection = useAppSelector(selectMyPotSelection);
    const myRevealedHand = useAppSelector(selectMyRevealedHand);

    const myContribution = bettingRound?.contributions[playerId ?? ''] ?? 0;
    const callAmount = Math.max(0, currentBet - myContribution);
    const canCheck = isMyTurn && callAmount === 0;

    const scan = useMemo(() => scanningCard(cards), [cards]);

    const nextConfirmTarget = useMemo((): 'hi' | 'lo' | null => {
        if (!myPotSelection) return null;
        if (myPotSelection === 'hi') return myHand?.hiSubmission ? null : 'hi';
        if (myPotSelection === 'lo') return myHand?.loSubmission ? null : 'lo';
        if (!myHand?.hiSubmission) return 'hi';
        if (!myHand?.loSubmission) return 'lo';
        return null;
    }, [myPotSelection, myHand?.hiSubmission, myHand?.loSubmission]);

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
        const val = Math.max(MIN_FORCED_BET, Math.min(Number(e.target.value), cash));
        setBetAmount(val);
    };

    const handleFirstBet = (isFirstBet: boolean = false) => {
        getSocket()?.emit(EMIT_BET_COIN, { roomCode, playerId, betting: MIN_FORCED_BET, isFirstBet });
        setEnableFirstBet(false);
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
        if (myPotSelection) return;
        getSocket()?.emit(EMIT_DECLARE_POT, { roomCode, playerId, selection });
    };

    const handleConfirmEquation = () => {
        if (!nextConfirmTarget || !scan.isValid) return;
        getSocket()?.emit(EMIT_SUBMIT_EQUATION, { roomCode, playerId, target: nextConfirmTarget, cards });
        setEnableFirstBet(true);
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
                            />
                        </div>
                        <button
                            className={`${styles.btn} ${styles.betBtn}`}
                            onClick={() => handleFirstBet(true)}
                            disabled={!enableFirstBet}
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

            {isPlaying && round === 4 && !myRevealedHand && (
                <div className={styles.potSelectionPanel}>
                    <span className={styles.bettingRoundLabel}>Declare your pot</span>
                    <div className={styles.actions}>
                        <button
                            className={`${styles.btn} ${styles.potBtn} ${myPotSelection === 'hi' ? styles.potBtnActive : ''}`}
                            onClick={() => handlePotSelection('hi')}
                            disabled={!!myPotSelection}
                        >
                            Hi Pot
                        </button>
                        <button
                            className={`${styles.btn} ${styles.potBtn} ${myPotSelection === 'lo' ? styles.potBtnActive : ''}`}
                            onClick={() => handlePotSelection('lo')}
                            disabled={!!myPotSelection}
                        >
                            Lo Pot
                        </button>
                        <button
                            className={`${styles.btn} ${styles.potBtn} ${myPotSelection === 'swing' ? styles.potBtnActive : ''}`}
                            onClick={() => handlePotSelection('swing')}
                            disabled={!!myPotSelection}
                        >
                            Swing
                        </button>
                    </div>

                    {myPotSelection && nextConfirmTarget && (
                        <>
                            <span className={`${styles.validityLabel} ${scan.isValid ? styles.validityValid : styles.validityInvalid}`}>
                                {scan.isValid
                                    ? `✓ Equation = ${scan.result}`
                                    : '⚠ Invalid arrangement — numbers can\'t be adjacent. Rearrange your cards.'}
                            </span>
                            <div className={styles.actions}>
                                <span className={styles.bettingRoundLabel}>
                                    Arrange your cards{myPotSelection === 'swing' ? ` for ${nextConfirmTarget === 'hi' ? 'Hi' : 'Lo'} Pot` : ''}
                                </span>
                                <button className={`${styles.btn} ${styles.betBtn}`} onClick={handleConfirmEquation} disabled={!scan.isValid}>
                                    Confirm Equation{myPotSelection === 'swing' ? ` (${nextConfirmTarget === 'hi' ? '1/2' : '2/2'})` : ''}
                                </button>
                            </div>
                        </>
                    )}

                    {myPotSelection && !nextConfirmTarget && (
                        <span className={styles.bettingRoundLabel}>Submitted — waiting for showdown…</span>
                    )}
                </div>
            )}
        </div>
    );
};
