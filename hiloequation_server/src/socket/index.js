'use strict';

const registerRoomHandlers = require('./handlers/room.handler');
const registerPlayerHandlers = require('./handlers/player.handler');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('[socket] connected:', socket.id);

        registerRoomHandlers(io, socket);
        registerPlayerHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log('[socket] disconnected:', socket.id);
        });
    });
};