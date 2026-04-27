import { ERROR } from '../socket/events';
import type { Server } from 'socket.io';

interface EmitHandlerOptions {
    io: Server;
    roomCode: string;
    eventName: string;
    result: any;
    buildSuccessPayload?: (value: any) => any;
}

const emitHandler = ({ io, roomCode, eventName, result, buildSuccessPayload = (v) => v }: EmitHandlerOptions) => {
    if (!result) {
        io.to(roomCode).emit(eventName, { status: ERROR });
        return false;
    }
    io.to(roomCode).emit(eventName, buildSuccessPayload(result));
    return true;
};

export { emitHandler };
