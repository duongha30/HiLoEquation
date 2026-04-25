import type { Server, Socket } from 'socket.io';
import registerRoomHandlers from './handlers/room.handler';
import registerPlayerHandlers from './handlers/player.handler';
import registerGameHandlers from './handlers/game.handler';
// import { socketAuth } from '../auth/authUtils';

export default (io: Server) => {
    // io.use(async (socket, next) => {
    //     try {
    //         const { keyStore, decodeUser } = await socketAuth(socket);
    //         socket.data.keyStore = keyStore;
    //         socket.data.decodeUser = decodeUser;
    //         next();
    //     } catch (err) {
    //         next(new Error((err as Error).message ?? 'Unauthorized'));
    //     }
    // });

    io.on('connection', (socket: Socket) => {
        console.log('[socket] connected:', socket.id);

        registerRoomHandlers(io, socket);
        registerPlayerHandlers(io, socket);
        registerGameHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log('[socket] disconnected:', socket.id);
        });
    });
};
