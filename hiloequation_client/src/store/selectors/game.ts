import { createAppSelector } from '../hooks';

export const selectAllHands = createAppSelector(
    [(state) => state.gameReducer.hands],
    (hands) => hands,
);

export const selectMyHand = createAppSelector(
    [(state) => state.gameReducer.hands, (state) => state.userReducer.userId],
    (hands, userId) => (userId ? (hands[userId] ?? null) : null),
);

export const selectOpponentHands = createAppSelector(
    [(state) => state.gameReducer.hands, (state) => state.userReducer.userId],
    (hands, userId) =>
        Object.entries(hands)
            .filter(([id]) => id !== userId)
            .map(([id, hand]) => ({ playerId: id, ...hand })),
);

export const selectTotalBetting = createAppSelector(
    [(state) => state.gameReducer],
    (game) => game.totalBetting,
);

export const selectGameStatus = createAppSelector(
    [(state) => state.gameReducer],
    (game) => game.status,
);

export const selectGameRound = createAppSelector(
    [(state) => state.gameReducer],
    (game) => game.round,
);
