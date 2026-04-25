import { createAppSelector } from '../hooks';

export const selectRoomTest = createAppSelector(
    [(state) => state.roomReducer],
    (roomReducer) => roomReducer.status,
);

export const selectAllGuess = createAppSelector(
    [(state) => state.roomReducer],
    (roomReducer) => roomReducer.players.filter(playerId => playerId !== roomReducer.hostId),
);