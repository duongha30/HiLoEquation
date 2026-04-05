'use strict'
const { Server } = require('socket.io');
//Init socket server, register namespaces

const initialSocket = (server) => {
    const io = new Server(server, {
        cors: { origin: '*' },
    });
    require('./index')(io);
    return io;
}

module.exports = initialSocket;