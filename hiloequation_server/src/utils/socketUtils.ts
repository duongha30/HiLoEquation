import { ERROR } from '../socket/events';
import type { Server } from 'socket.io';

interface EmitHandlerOptions {
    io: Server;
    roomId: string;
    eventName: string;
    result: unknown;
    buildSuccessPayload?: (value: unknown) => unknown;
}

const emitHandler = ({ io, roomId, eventName, result, buildSuccessPayload = (v) => v }: EmitHandlerOptions) => {
    if (!result) {
        io.to(roomId).emit(eventName, { status: ERROR });
        return false;
    }
    io.to(roomId).emit(eventName, buildSuccessPayload(result));
    return true;
};

export { emitHandler };
