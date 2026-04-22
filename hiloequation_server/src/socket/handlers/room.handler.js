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
    socket.on(ON_CREATE_ROOM, async ({ roomId, playerId }) => {
        try {
            await RoomService.accessRoomSocket({
                roomId,
                onRoomEvent: (data) => {
                    io.to(roomId).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, data });
                }
            });
            socket.join(roomId);
            io.to(roomId).emit(EMIT_PLAYER_JOIN, { status: SUCCESS });
        } catch (error) {
            io.to(roomId).emit(SOCKET_ERROR, { status: ERROR, message: error });
        }
    });

    socket.on(ON_JOIN_ROOM, async ({ roomId, playerId, password }) => {
        try {
            const players = await RoomService.accessRoomSocket({
                roomId,
                onRoomEvent: (data) => {
                    io.to(roomId).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, data });
                }
            });
            socket.join(roomId);
            io.to(roomId).emit(EMIT_PLAYER_JOIN, { status: SUCCESS, players });
        } catch (error) {
            io.to(roomId).emit(SOCKET_ERROR, { status: ERROR, message: error });
        }
    });

    socket.on(ON_LEAVE_ROOM, ({ roomId, playerId }) => {
        socket.leave(roomId);
        const roomState = Game.clearPlayer(roomId, playerId);
        emitHandler({
            io,
            roomId,
            eventName: EMIT_PLAYER_LEAVE,
            result: roomState,
            buildSuccessPayload: (value) => ({ roomState: value, playerId, status: SUCCESS }),
        });
    });
};