import type { Server, Socket } from 'socket.io';
import { SUCCESS, ERROR, ON_CREATE_ROOM, ON_JOIN_ROOM, ON_LEAVE_ROOM, ON_PLAYER_READY, EMIT_PLAYER_JOIN, EMIT_PLAYER_LEAVE, EMIT_PLAYER_READY, SOCKET_ERROR } from '../events';
import { Game } from '../../game';
import RoomService from '../../services/room.service';
import { updateCash } from '../../services/player.service';

async function handlePlayerLeave(io: Server, roomCode: string, playerId: string) {
    if (!roomCode || !playerId) return;
    // Persist the player's remaining cash (already-bet chips stay in the pot — totalBetting is untouched).
    const room = await Game.getRoom(roomCode);
    const cash = room?.hands?.[playerId]?.cash;
    if (typeof cash === 'number') await updateCash(playerId, cash);
    // Reset non-financial game state (Redis) and remove from the Mongo room.
    const roomState = await Game.clearPlayer(roomCode, playerId);
    await RoomService.removePlayerFromRoom({ roomCode, playerId });
    await RoomService.leaveRoomSocket({ roomCode, playerId });
    io.to(roomCode).emit(EMIT_PLAYER_LEAVE, { status: SUCCESS, roomState, playerId });
}

export default (io: Server, socket: Socket) => {
    socket.on(ON_CREATE_ROOM, async ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
        try {
            await RoomService.accessRoomSocket({
                roomCode,
                playerId,
                onRoomEvent: (data) => { io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, data }); },
            });
            socket.data.playerId = playerId;
            socket.data.roomCode = roomCode;
            socket.join(roomCode);
            io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS });
        } catch (error) {
            io.to(roomCode).emit(SOCKET_ERROR, { status: ERROR, message: error });
        }
    });

    socket.on(ON_JOIN_ROOM, async ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
        try {
            const { players, playerNames } = await RoomService.accessRoomSocket({
                roomCode,
                playerId,
                onRoomEvent: (data) => { io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, data }); },
            });
            socket.data.playerId = playerId;
            socket.data.roomCode = roomCode;
            socket.join(roomCode);
            io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, players, playerNames });
        } catch (error) {
            io.to(roomCode).emit(SOCKET_ERROR, { status: ERROR, message: error });
        }
    });

    socket.on(ON_PLAYER_READY, ({ roomCode, playerId, isReady }: { roomCode: string; playerId: string; isReady: boolean }) => {
        io.to(roomCode).emit(EMIT_PLAYER_READY, { status: SUCCESS, playerId, isReady });
    });

    socket.on(ON_LEAVE_ROOM, async ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
        socket.leave(roomCode);
        await handlePlayerLeave(io, roomCode, playerId);
    });

    socket.on('disconnect', async () => {
        const { roomCode, playerId } = socket.data as { roomCode?: string; playerId?: string };
        if (roomCode && playerId) await handlePlayerLeave(io, roomCode, playerId);
    });
};
