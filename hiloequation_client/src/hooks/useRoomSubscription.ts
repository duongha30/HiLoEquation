import { selectIsSocketConnected } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updatePlayersInRoom } from "@/store/reducers/room";
import { ON_PLAYER_JOIN, ON_PLAYER_READY } from "@/store/socket/events";
import { getSocket } from "@/store/socket/socket";
import { useRoomStore } from "@/screens/Room/roomStore";
import { useEffect } from "react";

type PlayerJoinSocketEvent = { status: number; players?: string[] };

export const useRoomSubscription = () => {
    const dispatch = useAppDispatch();
    const isConnected = useAppSelector(selectIsSocketConnected);
    const setPlayerReady = useRoomStore((s) => s.setPlayerReady);

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

        socket.on(ON_PLAYER_JOIN, onPlayerJoin);
        socket.on(ON_PLAYER_READY, onPlayerReady);

        return () => {
            socket.off(ON_PLAYER_JOIN, onPlayerJoin);
            socket.off(ON_PLAYER_READY, onPlayerReady);
        };
    }, [isConnected, setPlayerReady, dispatch]);
};