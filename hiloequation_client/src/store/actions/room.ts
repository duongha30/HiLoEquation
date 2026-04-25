import { createAppAsyncThunk, type AppAsyncThunkActionCases } from '../hooks';
import { getSocket } from '../socket/socket';
import { post } from '../api/post';
import type { CreateRoomResponse, JoinRoomResponse, FetchRoomsResponse, RoomDB } from '../types/room';
import { EMIT_JOIN_ROOM, ON_PLAYER_JOIN, SOCKET_ERROR } from '../socket/events';
import { get } from '../api/get';
import { SOCKET_ONCE_TIMEOUT } from '@/utils/constant';
import type { SocketPlayerJoin } from '../socket/types';

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
    async ({ password, hostId, maxPlayers }: { password: string, hostId: string, maxPlayers: number }, { rejectWithValue }) => {
        try {
            const socket = getSocket();
            if (!socket) {
                throw new Error('Socket not connected');
            }
            const { metadata } = await post<CreateRoomResponse>('/room/create', {
                password,
                hostId,
                maxPlayers
            });

            if (!metadata?._id) {
                throw new Error('Invalid room metadata');
            }

            return new Promise<RoomDB>((resolve, reject) => {
                socket.emit(EMIT_JOIN_ROOM, {
                    roomCode: metadata.roomCode,
                    playerId: metadata.hostId,
                });

                const onJoin = (response: SocketPlayerJoin) => {
                    clearTimeout(timeoutId);
                    socket.off(SOCKET_ERROR, onError);
                    console.log('Room created successfully:', response.status);
                    resolve(metadata);
                };

                const onError = (error: any) => {
                    clearTimeout(timeoutId);
                    socket.off(ON_PLAYER_JOIN, onJoin);
                    reject(new Error(error.message || 'Failed to create room'));
                };

                socket.once(ON_PLAYER_JOIN, onJoin);
                socket.once(SOCKET_ERROR, onError);

                const timeoutId = setTimeout(() => {
                    socket.off(ON_PLAYER_JOIN, onJoin);
                    socket.off(SOCKET_ERROR, onError);
                    reject(new Error('Room creation timeout'));
                }, SOCKET_ONCE_TIMEOUT);
            });
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err;
            }
            console.error('createRoom error:', err);
            return rejectWithValue((err as Error).message);
        }
    },
);

export const joinRoom = createAppAsyncThunk(
    'room/joinRoom',
    async ({ roomCode, playerId, password }: { roomCode: string, playerId: string, password: string }, thunkAPI) => {
        try {
            const socket = getSocket();
            if (!socket) {
                throw new Error('Socket not connected');
            }
            const { metadata } = await post<JoinRoomResponse>('/room/join', {
                roomCode,
                playerId,
                password
            });

            if (!metadata?._id) {
                throw new Error('Invalid room metadata');
            }

            return new Promise<RoomDB & { playerId: string, players: string[] }>((resolve, reject) => {
                socket.emit(EMIT_JOIN_ROOM, {
                    roomCode,
                    playerId,
                    password,
                });

                const onJoin = (response: SocketPlayerJoin) => {
                    clearTimeout(timeoutId);
                    socket.off(SOCKET_ERROR, onError);
                    console.log('Room joined successfully:', response.status);
                    const res = { ...metadata, playerId: response.playerId, players: response.players };
                    resolve(res);
                };

                const onError = (error: any) => {
                    clearTimeout(timeoutId);
                    socket.off(ON_PLAYER_JOIN, onJoin);
                    reject(new Error(error.message || 'Failed to join room'));
                };

                socket.once(ON_PLAYER_JOIN, onJoin);
                socket.once(SOCKET_ERROR, onError);

                const timeoutId = setTimeout(() => {
                    socket.off(ON_PLAYER_JOIN, onJoin);
                    socket.off(SOCKET_ERROR, onError);
                    reject(new Error('Join room timeout'));
                }, 5000);
            });
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err;
            }
            console.log('joinRoom error: ', err)
            return thunkAPI.rejectWithValue((err as Error).message);
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
    fulfilled: (state, action) => {
        state.status = 'idle';
        if (action.payload) {
            const { _id, roomCode, status, hostId, maxPlayers } = action.payload;
            state.id = _id;
            state.roomCode = roomCode;
            state.roomStatus = status || 'WAITING';
            state.hostId = hostId;
            state.maxPlayers = maxPlayers;
            state.players = [hostId]; // Host is first player
        }
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
        if (action.payload) {
            const { _id, status, roomCode, hostId, maxPlayers, players } = action.payload;
            state.id = _id;
            state.roomStatus = status || 'WAITING';
            state.roomCode = roomCode;
            state.hostId = hostId;
            state.maxPlayers = maxPlayers;
            state.players = [...players];
        }
    },
    rejected: (state) => {
        state.status = 'failed';
    },
    pending: (state) => {
        state.status = 'loading';
    },
};