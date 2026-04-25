import type { Server, Socket } from 'socket.io';
import { SUCCESS, ERROR, ON_BET_COIN, ON_FOLD_CARD, EMIT_BETTING, EMIT_FOLDING } from '../events';
import { Game } from '../../game';
import { emitHandler } from '../../utils/socketUtils';

export default (io: Server, socket: Socket) => {
    socket.on(ON_BET_COIN, ({ roomId, playerId, betting }: { roomId: string; playerId: string; betting: number }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_BETTING, { status: ERROR }); return; }

        const playerState = Game.bet(roomId, playerId, betting);
        emitHandler({ io, roomId, eventName: EMIT_BETTING, result: playerState, buildSuccessPayload: (value) => ({ playerState: value, status: SUCCESS }) });
    });

    socket.on(ON_FOLD_CARD, ({ roomId, playerId }: { roomId: string; playerId: string }) => {
        if (!playerId || socket.data.playerId !== playerId) { socket.emit(EMIT_FOLDING, { status: ERROR }); return; }

        const playerState = Game.fold(roomId, playerId);
        emitHandler({ io, roomId, eventName: EMIT_FOLDING, result: playerState, buildSuccessPayload: (value) => ({ playerState: value, status: SUCCESS }) });
    });
};
