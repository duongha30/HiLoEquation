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
        return () => {
            if (isConnected) {
                disconnectSocket();
                dispatch(disconnectSocketReducer());
            }
        };
    }, [isConnected]);
}