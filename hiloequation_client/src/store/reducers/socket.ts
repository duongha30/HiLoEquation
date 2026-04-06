import { createSlice } from '@reduxjs/toolkit';
import { compositeBuilder } from '../hooks';
import { connectSocketThunk, connectSocketThunkCases } from '../actions/socket';

type SocketState = {
    connected: boolean;
    id: string | undefined;
} | null;

type SocketReducerState = {
    status: 'idle' | 'loading' | 'failed';
    socket: SocketState;
};

const initialState: SocketReducerState = {
    status: 'idle',
    socket: null,
};

const socketSlice = createSlice({
    name: 'socket',
    initialState,
    reducers: {},
    extraReducers: builder => {
        compositeBuilder<'socketReducer'>(builder)
            .addCases(connectSocketThunk, connectSocketThunkCases)
    },
});

// export from reducers
// export const { } = socketSlice.actions;

export default socketSlice.reducer;
