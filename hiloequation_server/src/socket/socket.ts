import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import registerHandlers from './index';

const initialSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    registerHandlers(io);
    return io;
};

export default initialSocket;
