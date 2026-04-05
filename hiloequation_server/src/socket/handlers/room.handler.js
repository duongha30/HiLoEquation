'use strict';

const { RoomService } = require('../../services/room.service');

module.exports = (io, socket) => {
    socket.on('create_room', async (data) => {
        try {
            const room = await RoomService.createRoom(data);
            socket.join(room._id.toString());
            socket.emit('room_created', { room });
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    });
};