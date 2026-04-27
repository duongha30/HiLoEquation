import { disconnectSocketReducer, selectIsSocketConnected, connectSocketThunk, leaveRoom, resetGame, selectUserId, selectRoomCode } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { EMIT_LEAVE_ROOM } from "@/store/socket/events";
import { disconnectSocket, getSocket } from "@/store/socket/socket";
import { useEffect } from "react";

export const useConnectSocket = () => {
    const dispatch = useAppDispatch();
    const isConnected = useAppSelector(selectIsSocketConnected);

    useEffect(() => {
        const connectSocket = async () => {
            await dispatch(connectSocketThunk());
        }
        connectSocket();
    }, [isConnected]);
}

export const useDisconnectSocket = () => {
    const dispatch = useAppDispatch();
    const playerId = useAppSelector(selectUserId);
    const roomCode = useAppSelector(selectRoomCode);

    useEffect(() => {
        return () => {
            getSocket()?.emit(EMIT_LEAVE_ROOM, { roomCode, playerId });
            disconnectSocket();
            dispatch(disconnectSocketReducer());
            dispatch(resetGame());
            dispatch(leaveRoom());
        }
    }, []);
}