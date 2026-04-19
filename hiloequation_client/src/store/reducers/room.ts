import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { compositeBuilder } from '../hooks';
import type { Room } from '../types/room';
import { createRoom, createRoomCases, joinRoom, joinRoomCases } from '../actions/room';

const roomAdapter = createEntityAdapter<Room, string>({
    selectId: room => room.roomId,
});

const initialState = roomAdapter.getInitialState<{ status: string, players: string[] }>({
    status: 'idle',
    players: [],
});

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {},
    extraReducers: builder => {
        compositeBuilder<'roomReducer'>(builder)
            .addCases(createRoom, createRoomCases)
            .addCases(joinRoom, joinRoomCases)
    },
});

export const {
    selectById: selectRoomById,
} = roomAdapter.getSelectors<RootState>(state => state.roomReducer);

// export from reducers
// export const { } = roomSlice.actions;

export default roomSlice.reducer;
