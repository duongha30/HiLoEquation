import type { Server, Socket } from 'socket.io';
import {
    SUCCESS, ERROR,
    ON_START_GAME, ON_DEAL_CARD, ON_FINISH_GAME,
    EMIT_START, EMIT_GAME_RESULT, EMIT_CARD_DEAL,
} from '../events';
import { Game } from '../../game';
import { emitHandler } from '../../utils/socketUtils';
import { GameState } from '../../game/types';

export default (io: Server, socket: Socket) => {
    socket.on(ON_START_GAME, async ({ roomCode, playerIds }: { roomCode: string; playerIds: string[] }) => {
        const roomState = await Game.start(roomCode, playerIds);

        emitHandler({
            io, roomCode, eventName: EMIT_START, result: roomState, buildSuccessPayload: (value: GameState) => ({
                status: SUCCESS, roomState: {
                    round: value.round,
                    totalBetting: value.totalBetting,
                    hands: value.hands,
                }
            })
        });
    });

    socket.on(ON_DEAL_CARD, async ({ roomCode, playerId, times = 1, isFirstDraw = false }: { roomCode: string; playerId: string; times?: number; isFirstDraw?: boolean }) => {
        if (!playerId || socket.data.playerId !== playerId) {
            socket.emit(EMIT_CARD_DEAL, { status: ERROR });
            return;
        }

        const dealResult = await Game.deal(roomCode, playerId, times, isFirstDraw);
        if (!dealResult) { socket.emit(EMIT_CARD_DEAL, { status: ERROR }); return; }

        const { playerState, round } = dealResult;
        if (!playerState) { socket.emit(EMIT_CARD_DEAL, { status: ERROR }); return; }

        const socketIdsInRoom = io.sockets.adapter.rooms.get(roomCode);
        if (!socketIdsInRoom) return;

        for (const socketId of socketIdsInRoom) {
            const roomSocket = io.sockets.sockets.get(socketId);
            if (roomSocket?.data?.playerId === playerId) {
                roomSocket.emit(EMIT_CARD_DEAL, { roomCode, playerId, cards: playerState.cards, score: playerState.score, cash: playerState.cash, bet: playerState.bet, round });
                break;
            }
        }
    });

    socket.on(ON_FINISH_GAME, async ({ roomCode, playerId, result }: { roomCode: string; playerId: string; result: unknown }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_GAME_RESULT, { status: ERROR }); return; }

        const submissionState = await Game.setSubmission(roomCode, playerId, result as any);
        if (!submissionState) { socket.emit(EMIT_GAME_RESULT, { status: ERROR }); return; }

        const finalResult = await Game.finalizeRound(roomCode);
        emitHandler({ io, roomCode, eventName: EMIT_GAME_RESULT, result: finalResult, buildSuccessPayload: (value) => ({ result: value, status: SUCCESS }) });
    });
};
