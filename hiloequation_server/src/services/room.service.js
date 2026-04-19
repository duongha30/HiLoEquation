'use strict';

const { BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');
const RoomModel = require('../models/Room.model');
const { getInfoData } = require('../utils');

class RoomService {
    static async createRoom({ password, hostId, maxPlayers }) {
        if (maxPlayers > 4) throw new BadRequestError({ message: 'Max players exceeded!' });

        const newRoom = await RoomModel.create({ password, hostId, maxPlayers, players: [hostId] });
        if (!newRoom) {
            throw new BadRequestError({ message: 'Create new room failed!' });
        }
        return getInfoData({
            fields: ['_id', 'status', 'maxPlayers', 'hostId', 'players'],
            object: newRoom,
        });
    }

    static async getRoom({ roomId }) {
        const room = await RoomModel.findOne({ _id: roomId });
        if (!room) {
            throw new BadRequestError({ message: 'No room found!' });
        }
        return getInfoData({
            fields: ['_id', 'status', 'maxPlayers', 'hostId', 'players'],
            object: room,
        });
    }

    static async accessRoom({ roomId, password }) {
        const room = await RoomModel.findOne({ _id: roomId, password });
        if (!room) {
            return new BadRequestError({ message: 'Wrong Password or room id' });
        }
        return new OK({});
    }
}

module.exports = RoomService;