import { post } from '../api/post';
import { createAppAsyncThunk, type AppAsyncThunkActionCases } from '../hooks';
import type { FetchUserResponse, LoginPayload, SignupPayload, UserMetadata } from '../types';

export const signupThunk = createAppAsyncThunk<UserMetadata, SignupPayload>(
    'user/signup',
    async ({ username, email, password }, { signal, rejectWithValue }) => {
        try {
            const response = await post<FetchUserResponse>(
                '/signup',
                {
                    name: username,
                    email,
                    password,
                },
                {},
                signal,
            );
            return response.metadata;
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err; // let RTK handle the cancellation
            }
            return rejectWithValue((err as Error).message);
        }
    },
);

export const loginThunk = createAppAsyncThunk<UserMetadata, LoginPayload>(
    'user/login',
    async ({ email, password }, { signal, rejectWithValue }) => {
        try {
            const response = await post<FetchUserResponse>(
                '/login',
                {
                    email,
                    password,
                },
                {},
                signal,
            );
            return response.metadata;
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err; // let RTK handle the cancellation
            }
            return rejectWithValue((err as Error).message);
        }
    },
);

export const signupThunkCases: AppAsyncThunkActionCases<
    'userReducer',
    typeof signupThunk
> = {
    fulfilled: (state, action) => {
        state.status = 'idle';
        if (action.payload?.user) {
            console.log('state', state)
            const { _id, name, email } = action.payload.user;
            console.log('_id, name, email', _id, name, email)
            state.userId = _id;
            state.name = name;
            state.email = email;
        }
    },
    rejected: (state) => {
        state.status = 'failed';
    },
    pending: (state) => {
        state.status = 'loading';
    },
};

export const loginThunkCases: AppAsyncThunkActionCases<
    'userReducer',
    typeof loginThunk
> = {
    fulfilled: (state, action) => {
        state.status = 'idle';
        if (action.payload?.user) {
            const { _id, name, email } = action.payload.user;
            state.userId = _id;
            state.name = name;
            state.email = email;
        }
    },
    rejected: (state) => {
        state.status = 'failed';
    },
    pending: (state) => {
        state.status = 'loading';
    },
};