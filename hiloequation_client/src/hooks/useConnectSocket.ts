import { disconnectSocketReducer, selectIsSocketConnected, connectSocketThunk, leaveRoom, resetGame } from "@/store";
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

    useEffect(() => {
        return () => {
            disconnectSocket();
            dispatch(disconnectSocketReducer());
            dispatch(resetGame());
            dispatch(leaveRoom());
        }
    }, []);
}