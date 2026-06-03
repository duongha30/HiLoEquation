import { createAppSelector } from '../hooks';
import type { BettingRoundState } from '../reducers/game';

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

export const selectIsPlaying = createAppSelector(
    [(state) => state.gameReducer.isPlaying],
    (isPlaying) => isPlaying,
);

export const selectBettingRound = createAppSelector(
    [(state) => state.gameReducer.bettingRound],
    (br): BettingRoundState | null => br ?? null,
);

export const selectCurrentTurnPlayerId = createAppSelector(
    [(state) => state.gameReducer.bettingRound],
    (br) => (br?.active ? br.currentTurnPlayerId : null),
);

export const selectIsMyTurn = createAppSelector(
    [(state) => state.gameReducer.bettingRound, (state) => state.userReducer.userId],
    (br, userId) => br?.active === true && br.currentTurnPlayerId === userId,
);

export const selectCurrentBet = createAppSelector(
    [(state) => state.gameReducer.bettingRound],
    (br) => br?.currentBet ?? 0,
);
