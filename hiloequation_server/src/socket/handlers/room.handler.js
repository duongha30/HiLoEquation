'use strict';

const {
    SUCCESS,
    ERROR,
    ON_CREATE_ROOM,
    ON_JOIN_ROOM,
    ON_LEAVE_ROOM,
    EMIT_CREATE_ROOM,
    EMIT_PLAYER_JOIN,
    EMIT_PLAYER_LEAVE,
} = require('../events');
const { Game } = require('../../game');
const { emitHandler } = require('../../utils/socketUtils');
const RoomService = require('../../services/room.service');
const { StatusCodes } = require('../../utils/httpStatusCode');

module.exports = (io, socket) => {
    socket.on(ON_CREATE_ROOM, ({ roomId, playerId }) => {
        socket.join(roomId);
        socket.data.playerId = playerId;
        io.to(roomId).emit(EMIT_CREATE_ROOM, { status: SUCCESS });
    });

    socket.on(ON_JOIN_ROOM, async ({ roomId, playerId, password }) => {
        if (!playerId || !roomId) {
            socket.emit(EMIT_PLAYER_JOIN, { status: ERROR });
            return;
        }

        const res = await RoomService.accessRoom({ roomId, password });
        if (res.status !== StatusCodes.OK) {
            socket.emit(EMIT_PLAYER_JOIN, { status: res.status });
            return;
        }

        socket.join(roomId);
        socket.data.playerId = playerId;
        io.to(roomId).emit(EMIT_PLAYER_JOIN, { joinedPlayer: playerId, status: SUCCESS });
    });

    socket.on(ON_LEAVE_ROOM, ({ roomId, playerId }) => {
        socket.leave(roomId);
        const roomState = Game.clearPlayer(roomId, playerId);
        emitHandler({
            io,
            roomId,
            eventName: EMIT_PLAYER_LEAVE,
            result: roomState,
            buildSuccessPayload: (value) => ({ roomState: value, status: SUCCESS }),
        });
    });
};