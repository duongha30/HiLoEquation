import { createAppAsyncThunk, type AppAsyncThunkActionCases } from '../hooks';
import { retryRequest } from '../api/retryRequest';

type FetchRoomsResponse = {
    rooms: { roomId: string; code: string; status: string }[];
};

export const fetchRooms = createAppAsyncThunk(
    'room/fetchAllRooms',
    async (_, { signal, rejectWithValue }) => {
        try {
            const data = await retryRequest<FetchRoomsResponse>(
                (abortSignal) =>
                    fetch('/api/rooms', { signal: abortSignal })
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
    async (_, { signal, rejectWithValue }) => {
        try {
            // TODO: call create room API here
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err; // let RTK handle the cancellation
            }
            return rejectWithValue((err as Error).message);
        }
    },
);

export const createRoomCases: AppAsyncThunkActionCases<
    'roomReducer',
    typeof createRoom
> = {
    fulfilled: (state, action) => {
        state.status = 'idle';
    },
    rejected: (state) => {
        state.status = 'failed';
    },
    pending: (state) => {
        state.status = 'loading';
    },
};