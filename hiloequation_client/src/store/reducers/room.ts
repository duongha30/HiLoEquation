import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { compositeBuilder } from '../hooks';
import type { Room } from '../types/room';
import { createRoom, createRoomCases, fetchRoomById, fetchRoomByIdCases, joinRoom, joinRoomCases } from '../actions/room';

const roomAdapter = createEntityAdapter<Room, string>({
    selectId: room => room.roomId,
});

const initialState = roomAdapter.getInitialState<{ status: string, id: string, players: string[], roomStatus: string, hostId: string, maxPlayers: number }>({
    status: 'idle',
    id: '',
    players: [],
    roomStatus: 'WAITING',
    hostId: '',
    maxPlayers: 0,
});

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {
        leaveRoom: state => {
            state.players = [];
        },
        addPlayerToRoom: (state, action) => {
            if (!state.players) {
                state.players = [];
            }
            const playerId = action?.payload?.playerId;
            if (playerId && state.players.indexOf(playerId) === -1) {
                state.players.push(playerId);
            }
        },
        removePlayerFromRoom: (state, action) => {
            if (!state.players) {
                state.players = [];
                return;
            }
            const playerId = action?.payload?.playerId;
            if (playerId) {
                state.players = state.players.filter(id => id !== playerId);
            }
        },
    },
    extraReducers: builder => {
        compositeBuilder<'roomReducer'>(builder)
            .addCases(fetchRoomById, fetchRoomByIdCases)
            .addCases(createRoom, createRoomCases)
            .addCases(joinRoom, joinRoomCases)
    },
});

export const { leaveRoom, addPlayerToRoom, removePlayerFromRoom } = roomSlice.actions;
export const {
    selectById: selectRoomById,
} = roomAdapter.getSelectors<RootState>(state => state.roomReducer);

// export from reducers
// export const { } = roomSlice.actions;

export default roomSlice.reducer;
