import type { Server, Socket } from 'socket.io';
import { SUCCESS, ERROR, ON_BET_COIN, ON_FOLD_CARD, ON_PLAYER_ACTION, EMIT_BETTING, EMIT_FOLDING, EMIT_PLAYER_ACTION, EMIT_BETTING_ROUND_END, SOCKET_ERROR } from '../events';
import { Game } from '../../game';
import { emitHandler } from '../../utils/socketUtils';

export default (io: Server, socket: Socket) => {
    socket.on(ON_BET_COIN, async ({ roomCode, playerId, betting, isFirstBet }: { roomCode: string; playerId: string; betting: number, isFirstBet: boolean }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_BETTING, { status: ERROR }); return; }

        const playerState = await Game.bet(roomCode, playerId, betting, isFirstBet);
        emitHandler({ io, roomCode, eventName: EMIT_BETTING, result: playerState, buildSuccessPayload: (value) => ({ playerState: value, playerId, round: value.round, status: SUCCESS }) });
    });

    socket.on(ON_FOLD_CARD, async ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_FOLDING, { status: ERROR }); return; }

        const playerState = await Game.fold(roomCode, playerId);
        emitHandler({ io, roomCode, eventName: EMIT_FOLDING, result: playerState, buildSuccessPayload: (value) => ({ playerState: value, playerId, status: SUCCESS }) });
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
};
