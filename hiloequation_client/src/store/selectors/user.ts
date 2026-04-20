import { createAppSelector } from '../hooks';

export const selectUserInfo = createAppSelector(
    [(state) => state.userReducer],
    (userReducer) => userReducer,
);

export const selectUserId = createAppSelector(
    [(state) => state.userReducer],
    (userReducer) => userReducer.userId,
);