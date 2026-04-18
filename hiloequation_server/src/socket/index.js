'use strict';

const registerRoomHandlers = require('./handlers/room.handler');
const registerPlayerHandlers = require('./handlers/player.handler');
const registerGameHandlers = require('./handlers/game.handler');
// const { socketAuth } = require('../auth/authUtils');

module.exports = (io) => {
    // io.use(async (socket, next) => {    // middleware running before all req
    //     try {
    //         const { keyStore, decodeUser } = await socketAuth(socket);
    //         socket.data.keyStore = keyStore;
    //         socket.data.decodeUser = decodeUser;
    //         next();
    //     } catch (err) {
    //         next(new Error(err.message ?? 'Unauthorized'));
    //     }
    // });

    io.on('connection', (socket) => {
        console.log('[socket] connected:', socket.id);

        registerRoomHandlers(io, socket);
        registerPlayerHandlers(io, socket);
        registerGameHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log('[socket] disconnected:', socket.id);
        });
    });
};