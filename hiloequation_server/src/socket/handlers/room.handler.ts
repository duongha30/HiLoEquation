import type { Server, Socket } from 'socket.io';
import { SUCCESS, ERROR, ON_CREATE_ROOM, ON_JOIN_ROOM, ON_LEAVE_ROOM, ON_PLAYER_READY, EMIT_PLAYER_JOIN, EMIT_PLAYER_LEAVE, EMIT_PLAYER_READY, SOCKET_ERROR } from '../events';
import { Game } from '../../game';
import { emitHandler } from '../../utils/socketUtils';
import RoomService from '../../services/room.service';

export default (io: Server, socket: Socket) => {
    socket.on(ON_CREATE_ROOM, async ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
        try {
            await RoomService.accessRoomSocket({
                roomCode,
                playerId,
                onRoomEvent: (data) => { io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, data }); },
            });
            socket.join(roomCode);
            io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS });
        } catch (error) {
            io.to(roomCode).emit(SOCKET_ERROR, { status: ERROR, message: error });
        }
    });

    socket.on(ON_JOIN_ROOM, async ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
        try {
            const players = await RoomService.accessRoomSocket({
                roomCode,
                playerId,
                onRoomEvent: (data) => { io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, data }); },
            });
            socket.join(roomCode);
            io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, players });
        } catch (error) {
            io.to(roomCode).emit(SOCKET_ERROR, { status: ERROR, message: error });
        }
    });

    socket.on(ON_PLAYER_READY, ({ roomCode, playerId, isReady }: { roomCode: string; playerId: string; isReady: boolean }) => {
        io.to(roomCode).emit(EMIT_PLAYER_READY, { status: SUCCESS, playerId, isReady });
    });

    socket.on(ON_LEAVE_ROOM, async ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
        socket.leave(roomCode);
        await RoomService.leaveRoomSocket({ roomCode, playerId });
        const roomState = await Game.clearPlayer(roomCode, playerId);
        emitHandler({
            io,
            roomId: roomCode,
            eventName: EMIT_PLAYER_LEAVE,
            result: roomState,
            buildSuccessPayload: (value) => ({ roomState: value, playerId, status: SUCCESS }),
        });
    });
};
