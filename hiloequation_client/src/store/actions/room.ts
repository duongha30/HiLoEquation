import { createAppAsyncThunk, type AppAsyncThunkActionCases } from '../hooks';
import { retryRequest } from '../api/retryRequest';
import { getSocket } from '../socket/socket';
import { post } from '../api/post';
import type { CreateRoomResponse } from '../types/room';
import type { JoinRoomResponse } from '../../types/socketEventType';
import { EMIT_JOIN_ROOM, ON_PLAYER_JOIN } from '../socket/events';
import { addPlayerToRoom } from '../reducers/room';
import { get } from '../api/get';

type FetchRoomsResponse = {
    _id: string,
    status: string,
    maxPlayers: number,
    hostId: string,
    players: string[],
};

export const fetchRoomById = createAppAsyncThunk(
    'room/fetchRoomById',
    async (roomId: string, { signal, rejectWithValue }) => {
        try {
            const data = await get<FetchRoomsResponse>(`/room/${roomId}`, {}, signal);
            return data;
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err; // let RTK handle the cancellation
            }
            return rejectWithValue((err as Error).message);
        }
    },
);

export const createRoom = createAppAsyncThunk(
    'room/createRoom',
    async () => {
        try {
            //TODO: get hostId from auth state 
            const { metadata }: CreateRoomResponse = await post('/room/create', {
                password: "secret",
                hostId: "69d3e1aa55b4bc1d1f9dacaa",
                maxPlayers: 4
            });
            console.log('metadata', metadata)
            // const socket = getSocket();
            // console.log('socket', socket)
            // if (metadata) {
            //     //TODO: emit event with token
            //     socket.emit(EMIT_CREATE_ROOM, {
            //         roomId: metadata._id,
            //     });
            // }
            return metadata;
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err; // let RTK handle the cancellation
            }
            console.log('createRoom error: ', err)
            return null;
        }
    },
);

export const joinRoom = createAppAsyncThunk(
    'room/joinRoom',
    async ({ roomId, playerId, password }: { roomId: string, playerId: string, password: string }, thunkAPI): Promise<JoinRoomResponse | void> => {
        try {
            const socket = getSocket();
            await thunkAPI.dispatch(fetchRoomById(roomId));
            console.log('join playerId', playerId)
            return new Promise<JoinRoomResponse>((resolve, reject) => {
                socket.once(ON_PLAYER_JOIN, (data: JoinRoomResponse) => {
                    console.log('data', data)
                    if (data.playerId) {
                        thunkAPI.dispatch(addPlayerToRoom({ playerId: data.playerId }));
                    }
                    resolve(data);
                });
                socket.emit(EMIT_JOIN_ROOM, {
                    roomId,
                    playerId,
                    password,
                });
                setTimeout(() => {
                    socket.off(ON_PLAYER_JOIN);
                    reject(new Error('Join room timeout'));
                }, 5000);
            });
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err;
            }
            console.log('joinRoom error: ', err)
        }
    },
);
export const fetchRoomByIdCases: AppAsyncThunkActionCases<
    'roomReducer',
    typeof fetchRoomById
> = {
    fulfilled: (state, action) => {
        state.status = 'idle';
        if (action.payload) {
            const { _id, status, hostId, maxPlayers } = action.payload;
            state.id = _id;
            state.roomStatus = status;
            state.hostId = hostId;
            state.maxPlayers = maxPlayers;
        }
    },
    rejected: (state) => {
        state.status = 'failed';
    },
    pending: (state) => {
        state.status = 'loading';
    },
};

export const createRoomCases: AppAsyncThunkActionCases<
    'roomReducer',
    typeof createRoom
> = {
    fulfilled: (state) => {
        state.status = 'idle';
    },
    rejected: (state) => {
        state.status = 'failed';
    },
    pending: (state) => {
        state.status = 'loading';
    },
};

export const joinRoomCases: AppAsyncThunkActionCases<
    'roomReducer',
    typeof joinRoom
> = {
    fulfilled: (state, action) => {
        state.status = 'idle';
        if (action.payload?.roomId) {
            const { roomId } = action.payload;
            state.id = roomId;
        }
    },
    rejected: (state) => {
        state.status = 'failed';
    },
    pending: (state) => {
        state.status = 'loading';
    },
};