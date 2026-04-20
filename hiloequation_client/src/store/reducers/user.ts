import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { compositeBuilder } from '../hooks';
import { loginThunk, loginThunkCases, signupThunk, signupThunkCases } from '../actions/user';

type User = {
    status: string;
    userId: string;
    name: string;
    email: string;
};

const userAdapter = createEntityAdapter<User, string>({
    selectId: user => user.userId,
});

const initialState = userAdapter.getInitialState<User>({
    status: 'idle',
    userId: '',
    name: '',
    email: '',
});

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: builder => {
        compositeBuilder<'userReducer'>(builder)
            .addCases(signupThunk, signupThunkCases)
            .addCases(loginThunk, loginThunkCases)
    },
});

export default userSlice.reducer;
