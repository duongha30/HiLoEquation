import { createAppSelector } from '../hooks';

export const selectSocket = createAppSelector(
    [(state) => state.socketReducer],
    (socketReducer) => socketReducer.socket,
);

export const selectIsSocketConnected = createAppSelector(
    [(state) => state.socketReducer],
    (socketReducer) => socketReducer.isConnected,
);