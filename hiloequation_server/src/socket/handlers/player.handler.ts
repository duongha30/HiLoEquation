import type { Server, Socket } from 'socket.io';
import { SUCCESS, ERROR, ON_BET_COIN, ON_FOLD_CARD, EMIT_BETTING, EMIT_FOLDING } from '../events';
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
};
