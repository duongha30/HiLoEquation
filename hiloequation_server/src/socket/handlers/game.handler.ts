import type { Server, Socket } from 'socket.io';
import {
    SUCCESS, ERROR,
    ON_START_GAME, ON_DEAL_CARD, ON_FINISH_GAME, ON_DECLARE_POT, ON_SUBMIT_EQUATION,
    EMIT_START, EMIT_GAME_RESULT, EMIT_CARD_DEAL, EMIT_DECLARE_POT, EMIT_SUBMIT_EQUATION, EMIT_SHOWDOWN_RESULT,
} from '../events';
import { Game } from '../../game';
import { emitHandler } from '../../utils/socketUtils';
import { encryptCards } from '../../game/deck.ts';
import { declarePhaseTimer } from '../declarePhaseTimer.ts';
import type { GameState, HandsType } from '../../game/types';

function buildWireHands(hands: HandsType): HandsType {
    const wireHands: HandsType = {};
    for (const playerId in hands) {
        const hand = hands[playerId];
        wireHands[playerId] = {
            ...hand,
            cards: hand.cards ? encryptCards(hand.cards, playerId) : hand.cards,
        };
    }
    return wireHands;
}

export default (io: Server, socket: Socket) => {
    socket.on(ON_START_GAME, async ({ roomCode, playerIds }: { roomCode: string; playerIds: string[] }) => {
        await Game.start(roomCode, playerIds);
        const roomState = await Game.deal(roomCode, playerIds, 1, true);

        emitHandler({
            io, roomCode, eventName: EMIT_START, result: roomState, buildSuccessPayload: (value: GameState) => ({
                status: SUCCESS, roomState: {
                    round: value.round,
                    totalBetting: value.totalBetting,
                    hands: buildWireHands(value.hands),
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
                    hands: buildWireHands(value.hands),
                    bettingRound: value.bettingRound,
                }
            })
        });
    });

    socket.on(ON_DECLARE_POT, async ({ roomCode, playerId, selection }: { roomCode: string; playerId: string; selection: 'hi' | 'lo' | 'swing' }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_DECLARE_POT, { status: ERROR }); return; }

        const roomState = await Game.declarePot(roomCode, playerId, selection);
        if (!roomState) { socket.emit(EMIT_DECLARE_POT, { status: ERROR }); return; }

        io.to(roomCode).emit(EMIT_DECLARE_POT, {
            status: SUCCESS,
            roomState: {
                round: roomState.round,
                totalBetting: roomState.totalBetting,
                hands: roomState.hands,
                bettingRound: roomState.bettingRound,
            },
        });
    });

    socket.on(ON_SUBMIT_EQUATION, async ({ roomCode, playerId, target, cards }: { roomCode: string; playerId: string; target: 'hi' | 'lo'; cards: import('../../game/types').CardData[] }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_SUBMIT_EQUATION, { status: ERROR }); return; }

        const submitResult = await Game.submitEquation(roomCode, playerId, target, cards);
        if (!submitResult) { socket.emit(EMIT_SUBMIT_EQUATION, { status: ERROR }); return; }

        const { state, allComplete } = submitResult;
        io.to(roomCode).emit(EMIT_SUBMIT_EQUATION, {
            status: SUCCESS,
            playerId,
            roomState: {
                round: state.round,
                totalBetting: state.totalBetting,
                hands: state.hands,
                bettingRound: state.bettingRound,
            },
        });

        if (allComplete) {
            declarePhaseTimer.cancel(roomCode);
            const showdown = await Game.runShowdown(roomCode);
            if (showdown) {
                io.to(roomCode).emit(EMIT_SHOWDOWN_RESULT, { status: SUCCESS, ...showdown });
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
