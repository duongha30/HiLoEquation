import { createAppSelector } from '../hooks';

export const selectRoomTest = createAppSelector(
    [(state) => state.roomReducer],
    (roomReducer) => roomReducer.status,
);

export const selectRoomCode = createAppSelector(
    [(state) => state.roomReducer],
    (roomReducer) => roomReducer.roomCode,
);

export const selectAllPlayers = createAppSelector(
    [(state) => state.roomReducer],
    (roomReducer) => roomReducer.players,
);

export const selectAllGuess = createAppSelector(
    [(state) => state.roomReducer.players, (state) => state.userReducer.userId],
    (players, userId) => players?.filter((id) => id !== userId) ?? [],
);

export const isHostPlayer = createAppSelector(
    [(state) => state.roomReducer.hostId, (state) => state.userReducer.userId],
    (hostId, userId) => hostId === userId,
);