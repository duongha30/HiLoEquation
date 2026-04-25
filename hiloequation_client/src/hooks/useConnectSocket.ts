import { disconnectSocketReducer, selectIsSocketConnected, connectSocketThunk } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { disconnectSocket } from "@/store/socket/socket";
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
        }
    }, []);
}