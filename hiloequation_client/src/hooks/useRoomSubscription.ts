import { selectAllPlayers, selectIsSocketConnected, selectRoomCode, selectUserId, setGameState, setPlayingStatus } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updatePlayersInRoom } from "@/store/reducers/room";
import { EMIT_DEAL_CARD, ON_CARD_DEAL, ON_PLAYER_JOIN, ON_PLAYER_READY, ON_START } from "@/store/socket/events";
import { getSocket } from "@/store/socket/socket";
import { useRoomStore } from "@/screens/Room/roomStore";
import type { ServerRoomState } from '@/store/reducers/game';
import { useEffect } from 'react';

type PlayerJoinSocketEvent = { status: number; players?: string[] };
type StartGameSocketEvent = { status: number; roomState: ServerRoomState };

export const useRoomSubscription = () => {
    const dispatch = useAppDispatch();
    const isConnected = useAppSelector(selectIsSocketConnected);
    const setPlayerReady = useRoomStore((s) => s.setPlayerReady);
    const players = useAppSelector(selectAllPlayers);
    const roomCode = useAppSelector(selectRoomCode);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) {
            console.warn('Socket not initialized');
            return;
        }

        const onPlayerJoin = (data: PlayerJoinSocketEvent) => {
            if (data.status !== 200) {
                console.error('Failed to join room:', data);
                return;
            }
            if (data?.players) {
                dispatch(updatePlayersInRoom({ players: data.players }));
            }
        };

        const onPlayerReady = (data: { playerId: string; isReady: boolean }) => {
            setPlayerReady(data.playerId, data.isReady);
        };

        const onStartGame = (data: StartGameSocketEvent) => {
            if (data.status !== 200 || !data.roomState) return;
            dispatch(setGameState(data.roomState));
            dispatch(setPlayingStatus(true));
            getSocket()?.emit(EMIT_DEAL_CARD, { roomCode, players, times: 1, isFirstDraw: true });
        };

        const onDealCard = (data: any) => {
            console.log('onDealCard data', data)
            if (data.status !== 200 || !data.roomState) return;
            dispatch(setGameState(data.roomState));
        }

        socket.on(ON_PLAYER_JOIN, onPlayerJoin);
        socket.on(ON_PLAYER_READY, onPlayerReady);
        socket.on(ON_START, onStartGame);
        socket.on(ON_CARD_DEAL, onDealCard);

        return () => {
            socket.off(ON_PLAYER_JOIN, onPlayerJoin);
            socket.off(ON_PLAYER_READY, onPlayerReady);
            socket.off(ON_START, onStartGame);
            socket.off(ON_CARD_DEAL, onDealCard);
        };
    }, [isConnected, setPlayerReady, dispatch]);
};