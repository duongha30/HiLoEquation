import styles from './StartReadyButton.module.css';
import {
    isHostPlayer,
    selectAllGuess,
    selectRoomCode,
    selectAllPlayers,
    selectIsPlaying,
    selectGameRound
} from '@/store';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/selectors/user';
import { useRoomStore } from '../../roomStore';
import { getSocket } from '@/store/socket/socket';
import { EMIT_START_GAME, EMIT_PLAYER_READY, EMIT_DEAL_CARD } from '@/store/socket/events';
import { useEffect } from 'react';

export function StartReadyButton() {
    const isHost = useAppSelector(isHostPlayer);
    const guess = useAppSelector(selectAllGuess);
    const roomCode = useAppSelector(selectRoomCode);
    const players = useAppSelector(selectAllPlayers);
    const userId = useAppSelector(selectUserId);
    const isPlaying = useAppSelector(selectIsPlaying);
    const { readyPlayers, setPlayerReady } = useRoomStore();

    const round = useAppSelector(selectGameRound);

    const isReady = readyPlayers.includes(userId ?? '');
    const allGuestsReady = guess.length > 0 && guess.every((id) => readyPlayers.includes(id));

    useEffect(() => {
        if (isPlaying && round === 1) {
            getSocket()?.emit(EMIT_DEAL_CARD, { roomCode, players, times: 1, isFirstDraw: false });
        }
    }, [round, isPlaying, roomCode, players]);

    const handleStartGame = () => {
        getSocket()?.emit(EMIT_START_GAME, { roomCode, playerIds: players });
    };

    const handleToggleReady = () => {
        const next = !isReady;
        setPlayerReady(userId ?? '', next);
        getSocket()?.emit(EMIT_PLAYER_READY, { roomCode, playerId: userId, isReady: next });
    };
    if (isPlaying) return null;

    return (
        <>
            {isHost ? (
                <button
                    onClick={handleStartGame}
                    disabled={!allGuestsReady}
                    className={styles.btn}
                >
                    Start Game!
                </button>
            ) : (
                <button
                    onClick={handleToggleReady}
                    className={`${styles.btn} ${isReady ? styles.readyActive : ''}`}
                >
                    {isReady ? 'Cancel Ready' : 'Ready'}
                </button>
            )}
        </>
    );
}
