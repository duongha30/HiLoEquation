import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { compositeBuilder } from '../hooks';
import { createRoom, createRoomCases } from '../actions/room';

type Room = {
    roomId: string;
    status: 'idle' | 'loading' | 'failed';
    roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED';
    maxPlayers: number;
    password?: string;
    hostId: string;
    players: string[];
};

const roomAdapter = createEntityAdapter<Room, string>({
    selectId: room => room.roomId,
});

const initialState = roomAdapter.getInitialState<{
    status: 'idle' | 'loading' | 'failed';
}>({
    status: 'idle',
});

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {},
    extraReducers: builder => {
        compositeBuilder<'roomReducer'>(builder)
            .addCases(createRoom, createRoomCases)
    },
});

export const {
    selectById: selectRoomById,
} = roomAdapter.getSelectors<RootState>(state => state.roomReducer);

// export from reducers
// export const { } = roomSlice.actions;

export default roomSlice.reducer;
