'use strict';

const { RoomService } = require('../../services/room.service');

module.exports = (io, socket) => {
    socket.join();
};