import styles from './StartReadyButton.module.css';
import {
    isHostPlayer,
    selectAllGuess,
    selectRoomCode,
    selectAllPlayers,
    selectIsPlaying
} from '@/store';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/selectors/user';
import { useRoomStore } from '../../roomStore';
import { getSocket } from '@/store/socket/socket';
import { EMIT_START_GAME, EMIT_PLAYER_READY } from '@/store/socket/events';

export function StartReadyButton() {
    const isHost = useAppSelector(isHostPlayer);
    const guess = useAppSelector(selectAllGuess);
    const roomCode = useAppSelector(selectRoomCode);
    const players = useAppSelector(selectAllPlayers);
    const userId = useAppSelector(selectUserId);
    const isPlaying = useAppSelector(selectIsPlaying);
    const { readyPlayers, setPlayerReady } = useRoomStore();

    const isReady = readyPlayers.includes(userId ?? '');
    const allGuestsReady = guess.length > 0 && guess.every((id) => readyPlayers.includes(id));

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
