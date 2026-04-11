'use strict';

const { BadRequestError } = require('../core/error.response');
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
}

module.exports = RoomService;