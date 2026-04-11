'use strict';

const { RoomService } = require('../../services/room.service');
const { CREATE_ROOM } = require('../events');

module.exports = (io, socket) => {
    socket.on(CREATE_ROOM, ({ roomId }) => {
        socket.join(roomId);
    });
};