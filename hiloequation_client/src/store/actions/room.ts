import { createAppAsyncThunk, type AppAsyncThunkActionCases } from '../hooks';
import { retryRequest } from '../api/retryRequest';
import { getSocket } from '../socket/socket';
import { post } from '../api/post';
import type { CreateRoomResponse } from '@/types/room';
import { CREATE_ROOM } from '../socket/events';

type FetchRoomsResponse = {
    rooms: { roomId: string; code: string; status: string }[];
};

export const fetchRooms = createAppAsyncThunk(
    'room/fetchAllRooms',
    async (_, { signal, rejectWithValue }) => {
        try {
            const data = await retryRequest<FetchRoomsResponse>(
                (abortSignal) =>
                    fetch('/rooms', { signal: abortSignal })
                        .then(res => {
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                            return res.json() as Promise<FetchRoomsResponse>;
                        }),
                { retries: 3, delayMs: 300, signal }, // RTK's signal forwarded here
            );
            return data.rooms;
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
            const socket = getSocket();
            console.log('socket', socket)
            if (metadata) {
                //TODO: emit event with 
                socket.emit(CREATE_ROOM, {
                    roomId: metadata._id,
                });
            }
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