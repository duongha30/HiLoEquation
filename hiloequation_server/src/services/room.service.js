'use strict';

const { BadRequestError } = require('../core/error.response');
const RoomModel = require('../models/Room.model');

class RoomService {
    constructor({ code, status = 'WAITING', maxPlayers = 4, password, hostId, players = [] }) {
        this.code = code;
        this.status = status;
        this.maxPlayers = maxPlayers;
        this.password = password;
        this.hostId = hostId;
        this.players = players;
    }

    static async createRoom({ code, password, hostId, maxPlayers }) {
        const newRoom = await RoomModel.create({ code, password, hostId, maxPlayers });
        if (!newRoom) {
            throw new BadRequestError('Create new room failed!');
        }
        return newRoom;
    }
}

module.exports = { RoomService };