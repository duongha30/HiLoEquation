import { selectIsSocketConnected } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updatePlayersInRoom } from "@/store/reducers/room";
import { ON_PLAYER_JOIN } from "@/store/socket/events";
import { getSocket } from "@/store/socket/socket";
import type { JoinRoomResponse } from "@/types/socketEventType";
import { useEffect } from "react";

export const useRoomSubscription = () => {
    const dispatch = useAppDispatch();
    const isConnected = useAppSelector(selectIsSocketConnected);
    useEffect(() => {
        const socket = getSocket();
        if (!socket) {
            console.warn('Socket not initialized');
            return;
        }

        socket.on(ON_PLAYER_JOIN, (data: JoinRoomResponse) => {
            console.log('data', data)
            if (data.status !== 200) {
                console.error('Failed to join room:', data);
                return;
            }
            if (data?.players) {
                dispatch(updatePlayersInRoom({ players: data?.players }));
            }
        });
        return () => {
            socket.off(ON_PLAYER_JOIN);
        };
    }, [isConnected]);
};