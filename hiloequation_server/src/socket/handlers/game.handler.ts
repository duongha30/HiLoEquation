import type { Server, Socket } from 'socket.io';
import {
    SUCCESS, ERROR,
    ON_START_GAME, ON_DEAL_CARD, ON_FINISH_GAME,
    EMIT_START, EMIT_GAME_RESULT, EMIT_CARD_DEAL,
} from '../events';
import { Game } from '../../game';
import { emitHandler } from '../../utils/socketUtils';
import type { GameState } from '../../game/types';

export default (io: Server, socket: Socket) => {
    socket.on(ON_START_GAME, async ({ roomCode, playerIds }: { roomCode: string; playerIds: string[] }) => {
        await Game.start(roomCode, playerIds);
        const roomState = await Game.deal(roomCode, playerIds, 1, true);

        emitHandler({
            io, roomCode, eventName: EMIT_START, result: roomState, buildSuccessPayload: (value: GameState) => ({
                status: SUCCESS, roomState: {
                    round: value.round,
                    totalBetting: value.totalBetting,
                    hands: value.hands,
                    bettingRound: value.bettingRound,
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

        if (roomState.round === 1 || roomState.round === 2 || roomState.round === 3) {
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

    socket.on(ON_FINISH_GAME, async ({ roomCode, playerId, result }: { roomCode: string; playerId: string; result: unknown }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_GAME_RESULT, { status: ERROR }); return; }

        const submissionState = await Game.setSubmission(roomCode, playerId, result as any);
        if (!submissionState) { socket.emit(EMIT_GAME_RESULT, { status: ERROR }); return; }

        const finalResult = await Game.finalizeRound(roomCode);
        emitHandler({ io, roomCode, eventName: EMIT_GAME_RESULT, result: finalResult, buildSuccessPayload: (value) => ({ result: value, status: SUCCESS }) });
    });
};
