import type { Server, Socket } from 'socket.io';
import {
    SUCCESS, ERROR,
    ON_START_GAME, ON_DEAL_CARD, ON_FINISH_GAME,
    EMIT_START, EMIT_GAME_RESULT, EMIT_CARD_DEAL,
} from '../events';
import { Game } from '../../game';
import { emitHandler } from '../../utils/socketUtils';
import type { GameState, HandsType } from '../../game/types';

const maskHandsForViewer = (hands: HandsType, viewerId: string): HandsType => {
    const result: HandsType = {};
    for (const pid in hands) {
        if (pid === viewerId) {
            result[pid] = hands[pid];
        } else {
            result[pid] = {
                ...hands[pid],
                cards: hands[pid].cards?.map((card) =>
                    card.hidden ? { id: card.id, type: card.type, hidden: true } : card
                ) ?? null,
            };
        }
    }
    return result;
};

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
        const roomState = await Game.deal(roomCode, players, times, isFirstDraw);
        if (!roomState) {
            socket.emit(EMIT_CARD_DEAL, { status: ERROR });
            return;
        }

        const sockets = await io.in(roomCode).fetchSockets();
        for (const s of sockets) {
            const viewerId: string = s.data.playerId;
            s.emit(EMIT_CARD_DEAL, {
                status: SUCCESS,
                roomState: {
                    round: roomState.round,
                    totalBetting: roomState.totalBetting,
                    hands: maskHandsForViewer(roomState.hands, viewerId),
                },
            });
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
