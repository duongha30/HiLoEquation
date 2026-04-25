import type { Server, Socket } from 'socket.io';
import {
    SUCCESS, ERROR,
    ON_START_GAME, ON_DEAL_CARD, ON_FINISH_GAME,
    EMIT_START, EMIT_GAME_RESULT, EMIT_CARD_DEAL,
} from '../events';
import { Game } from '../../game';
import { emitHandler } from '../../utils/socketUtils';

export default (io: Server, socket: Socket) => {
    socket.on(ON_START_GAME, ({ roomId, playerIds }: { roomId: string; playerIds: string[] }) => {
        const roomState = Game.start(roomId, playerIds);
        emitHandler({ io, roomId, eventName: EMIT_START, result: roomState, buildSuccessPayload: (value) => ({ roomState: value, status: SUCCESS }) });
    });

    socket.on(ON_DEAL_CARD, ({ roomId, playerId, times = 1, isFirstDraw = false }: { roomId: string; playerId: string; times?: number; isFirstDraw?: boolean }) => {
        if (!playerId || socket.data.playerId !== playerId) {
            socket.emit(EMIT_CARD_DEAL, { status: ERROR });
            return;
        }

        const dealResult = Game.deal(roomId, playerId, times, isFirstDraw);
        if (!dealResult) { socket.emit(EMIT_CARD_DEAL, { status: ERROR }); return; }

        const { playerState, round } = dealResult;
        if (!playerState) { socket.emit(EMIT_CARD_DEAL, { status: ERROR }); return; }

        const socketIdsInRoom = io.sockets.adapter.rooms.get(roomId);
        if (!socketIdsInRoom) return;

        for (const socketId of socketIdsInRoom) {
            const roomSocket = io.sockets.sockets.get(socketId);
            if (roomSocket?.data?.playerId === playerId) {
                roomSocket.emit(EMIT_CARD_DEAL, { roomId, playerId, cards: playerState.cards, score: playerState.score, cash: playerState.cash, bet: playerState.bet, round });
                break;
            }
        }
    });

    socket.on(ON_FINISH_GAME, ({ roomId, playerId, result }: { roomId: string; playerId: string; result: unknown }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_GAME_RESULT, { status: ERROR }); return; }

        const submissionState = Game.setSubmission(roomId, playerId, result as any);
        if (!submissionState) { socket.emit(EMIT_GAME_RESULT, { status: ERROR }); return; }

        const finalResult = Game.finalizeRound(roomId);
        emitHandler({ io, roomId, eventName: EMIT_GAME_RESULT, result: finalResult, buildSuccessPayload: (value) => ({ result: value, status: SUCCESS }) });
    });
};
