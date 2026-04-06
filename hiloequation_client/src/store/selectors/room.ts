import { createAppSelector } from '../hooks';

export const selectRoomTest = createAppSelector(
    [(state) => state.roomReducer],
    (roomReducer) => roomReducer.status,
);