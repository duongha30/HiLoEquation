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
    isConnected: boolean;
};

const initialState: SocketReducerState = {
    status: 'idle',
    socket: null,
    isConnected: false,
};

const socketSlice = createSlice({
    name: 'socket',
    initialState,
    reducers: {
        disconnectSocketReducer: state => {
            state.isConnected = false;
        },
    },
    extraReducers: builder => {
        compositeBuilder<'socketReducer'>(builder)
            .addCases(connectSocketThunk, connectSocketThunkCases)
    },
});
export const { disconnectSocketReducer } = socketSlice.actions;
// export from reducers
// export const { } = socketSlice.actions;

export default socketSlice.reducer;
