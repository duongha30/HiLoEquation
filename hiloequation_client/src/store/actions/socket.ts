import { createAppAsyncThunk, type AppAsyncThunkActionCases } from '../hooks';
import { connectSocket } from '@/store/socket/socket';

type SocketMeta = {
    connected: boolean;
    id: string | undefined;
};

export const connectSocketThunk = createAppAsyncThunk(
    'socket/connectSocket',
    async (_, { rejectWithValue }) => {
        try {
            const socket = await connectSocket();
            console.log('socket', socket)
            // Return only serializable data — never put Socket instances in Redux
            return { connected: socket.connected, id: socket.id } satisfies SocketMeta;
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err;
            }
            return rejectWithValue((err as Error).message);
        }
    },
);

export const connectSocketThunkCases: AppAsyncThunkActionCases<
    'socketReducer',
    typeof connectSocketThunk
> = {
    fulfilled: (state, action) => {
        state.status = 'idle';
        state.socket = action.payload;
        state.isConnected = true;
    },
    rejected: (state) => {
        state.status = 'failed';
        state.socket = null;
    },
    pending: (state) => {
        state.status = 'loading';
    },
};