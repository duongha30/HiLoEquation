'use strict';

const {
    SUCCESS,
    ERROR,
    ON_CREATE_ROOM,
    ON_JOIN_ROOM,
    ON_LEAVE_ROOM,
    EMIT_PLAYER_JOIN,
    EMIT_PLAYER_LEAVE,
    SOCKET_ERROR,
} = require('../events');
const { Game } = require('../../game');
const { emitHandler } = require('../../utils/socketUtils');
const { StatusCodes } = require('../../utils/httpStatusCode');
const RoomService = require('../../services/room.service');

module.exports = (io, socket) => {
    socket.on(ON_CREATE_ROOM, async ({ roomCode, playerId }) => {
        try {
            await RoomService.accessRoomSocket({
                roomCode,
                playerId,
                onRoomEvent: (data) => {
                    io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, data });
                }
            });
            socket.join(roomCode);
            io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS });
        } catch (error) {
            io.to(roomCode).emit(SOCKET_ERROR, { status: ERROR, message: error });
        }
    });

    socket.on(ON_JOIN_ROOM, async ({ roomCode, playerId, password }) => {
        try {
            const players = await RoomService.accessRoomSocket({
                roomCode,
                playerId,
                onRoomEvent: (data) => {
                    io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, data });
                }
            });
            socket.join(roomCode);
            io.to(roomCode).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, players });
        } catch (error) {
            io.to(roomCode).emit(SOCKET_ERROR, { status: ERROR, message: error });
        }
    });

    socket.on(ON_LEAVE_ROOM, async ({ roomCode, playerId }) => {
        socket.leave(roomCode);
        await RoomService.leaveRoomSocket({ roomCode, playerId });
        const roomState = Game.clearPlayer(roomCode, playerId);
        emitHandler({
            io,
            roomCode,
            eventName: EMIT_PLAYER_LEAVE,
            result: roomState,
            buildSuccessPayload: (value) => ({ roomState: value, playerId, status: SUCCESS }),
        });
    });
};