import type { Server, Socket } from 'socket.io';
import {
    SUCCESS, ERROR,
    ON_START_GAME, ON_DEAL_CARD, ON_FINISH_GAME, ON_PLAYER_ACTION,
    EMIT_START, EMIT_GAME_RESULT, EMIT_CARD_DEAL, EMIT_PLAYER_ACTION, EMIT_BETTING_ROUND_END,
    SOCKET_ERROR,
} from '../events';
import { Game } from '../../game';
import { emitHandler } from '../../utils/socketUtils';
import type { GameState } from '../../game/types';

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

    socket.on(ON_DEAL_CARD, async ({ roomCode, players, times = 1, isFirstDraw = false }: { roomCode: string; players: string[]; times?: number; isFirstDraw?: boolean }) => {
        let roomState = await Game.deal(roomCode, players, times, isFirstDraw);
        if (!roomState) {
            socket.emit(EMIT_CARD_DEAL, { status: ERROR });
            return;
        }

        if (roomState.round === 3) {
            const playerIds = Object.keys(roomState.hands);
            const withBetting = await Game.startBettingRound(roomCode, playerIds);
            if (withBetting) roomState = withBetting;
        }

        emitHandler({
            io, roomCode, eventName: EMIT_CARD_DEAL, result: roomState, buildSuccessPayload: (value: GameState) => ({
                status: SUCCESS, roomState: {
                    round: value.round,
                    totalBetting: value.totalBetting,
                    hands: value.hands,
                    bettingRound: value.bettingRound,
                }
            })
        });
    });

    socket.on(ON_PLAYER_ACTION, async ({ roomCode, playerId, action, amount }: { roomCode: string; playerId: string; action: 'bet' | 'check' | 'fold'; amount?: number }) => {
        if (!playerId || socket.data.playerId !== playerId) {
            socket.emit(SOCKET_ERROR, { status: 403, message: 'Unauthorized' });
            return;
        }

        const result = await Game.processBettingAction(roomCode, playerId, action, amount);
        if (!result) {
            socket.emit(SOCKET_ERROR, { status: 400, message: 'Invalid action' });
            return;
        }

        const { state, roundEnded } = result;
        const payload = {
            status: SUCCESS,
            roomState: {
                round: state.round,
                totalBetting: state.totalBetting,
                hands: state.hands,
                bettingRound: state.bettingRound,
            },
        };

        const eventName = roundEnded ? EMIT_BETTING_ROUND_END : EMIT_PLAYER_ACTION;
        io.to(roomCode).emit(eventName, payload);
    });

    socket.on(ON_FINISH_GAME, async ({ roomCode, playerId, result }: { roomCode: string; playerId: string; result: unknown }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_GAME_RESULT, { status: ERROR }); return; }

        const submissionState = await Game.setSubmission(roomCode, playerId, result as any);
        if (!submissionState) { socket.emit(EMIT_GAME_RESULT, { status: ERROR }); return; }

        const finalResult = await Game.finalizeRound(roomCode);
        emitHandler({ io, roomCode, eventName: EMIT_GAME_RESULT, result: finalResult, buildSuccessPayload: (value) => ({ result: value, status: SUCCESS }) });
    });
};
