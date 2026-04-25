import { createAppSelector } from '../hooks';

export const selectRoomTest = createAppSelector(
    [(state) => state.roomReducer],
    (roomReducer) => roomReducer.status,
);

export const selectAllGuess = createAppSelector(
    [(state) => state.roomReducer.players, (state) => state.userReducer.userId],
    (players, userId) => players?.filter((id) => id !== userId) ?? [],
);