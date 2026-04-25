'use strict';

const {
    SUCCESS,
    ERROR,
    ON_START_GAME,
    ON_DEAL_CARD,
    ON_FINISH_GAME,
    EMIT_START,
    EMIT_GAME_RESULT,
    EMIT_CARD_DEAL,
} = require('../events');
const { Game } = require('../../game');
const { emitHandler } = require('../../utils/socketUtils');

module.exports = (io, socket) => {
    socket.on(ON_START_GAME, ({ roomId, playerIds }) => {
        const roomState = Game.start(roomId, playerIds);
        emitHandler({
            io,
            roomId,
            eventName: EMIT_START,
            result: roomState,
            buildSuccessPayload: (value) => ({ roomState: value, status: SUCCESS }),
        });
    });

    socket.on(ON_DEAL_CARD, ({ roomId, playerId, times = 1, isFirstDraw = false }) => {
        if (!playerId || socket.data.playerId !== playerId) {
            console.log('Error in ON_DEAL_CARD playerId: ', playerId)
            socket.emit(EMIT_CARD_DEAL, { status: ERROR });
            return;
        }

        const dealResult = Game.deal(roomId, playerId, times, isFirstDraw);
        if (!dealResult) {
            socket.emit(EMIT_CARD_DEAL, { status: ERROR });
            return;
        }

        const { playerState, round } = dealResult;
        if (!playerState) {
            console.log('Error in DEAL_CARD playerState: ', playerState)
            socket.emit(EMIT_CARD_DEAL, { status: ERROR });
            return;
        }

        const socketIdsInRoom = io.sockets.adapter.rooms.get(roomId);
        if (!socketIdsInRoom) {
            console.log('Error in DEAL_CARD socketIdsInRoom: ', socketIdsInRoom)
            return;
        }

        for (const socketId of socketIdsInRoom) {
            const roomSocket = io.sockets.sockets.get(socketId);
            if (roomSocket?.data?.playerId === playerId) {
                roomSocket.emit(EMIT_CARD_DEAL, {
                    roomId,
                    playerId,
                    cards: playerState.cards,
                    score: playerState.score,
                    cash: playerState.cash,
                    bet: playerState.bet,
                    round: round,
                });
                break;
            }
        }
    });

    socket.on(ON_FINISH_GAME, ({ roomId, playerId, result }) => {
        if (!playerId || socket.data.playerId !== playerId) {
            socket.emit(EMIT_GAME_RESULT, { status: ERROR });
            return;
        }

        const submissionState = Game.setSubmission(roomId, playerId, result);
        if (!submissionState) {
            socket.emit(EMIT_GAME_RESULT, { status: ERROR });
            return;
        }

        const roomState = Game.finalizeRound(roomId);
        emitHandler({
            io,
            roomId,
            eventName: EMIT_GAME_RESULT,
            result: roomState,
        });
    });
};