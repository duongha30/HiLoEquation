'use strict';

const {
    ON_BET_COIN,
    ON_FOLD_CARD,
    SUCCESS,
    ERROR,
    EMIT_BETTING,
    EMIT_FOLDING,
} = require('../events');
const { Game } = require('../../game');
const { emitHandler } = require('../../utils/socketUtils');

module.exports = (io, socket) => {
    socket.on(ON_BET_COIN, ({ roomId, playerId, betting }) => {
        if (!playerId || socket.data.playerId !== playerId) {
            socket.emit(EMIT_BETTING, { status: ERROR });
            return;
        }

        const playerState = Game.bet(roomId, playerId, betting);
        emitHandler({
            io,
            roomId,
            eventName: EMIT_BETTING,
            result: playerState,
            buildSuccessPayload: (value) => ({ playerState: value, status: SUCCESS })
        });
    });
    socket.on(ON_FOLD_CARD, ({ roomId, playerId }) => {
        if (!playerId || socket.data.playerId !== playerId) {
            socket.emit(EMIT_FOLDING, { status: ERROR });
            return;
        }

        const playerState = Game.fold(roomId, playerId);
        emitHandler({
            io,
            roomId,
            eventName: EMIT_FOLDING,
            result: playerState,
            buildSuccessPayload: (value) => ({ playerState: value, status: SUCCESS })
        });
    });
};