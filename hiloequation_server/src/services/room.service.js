'use strict';

const { BadRequestError, NotFoundError } = require('../core/error.response');
const { OK } = require('../core/success.response');
const RoomModel = require('../models/Room.model');
const { getInfoData } = require('../utils');
const redisPubSubService = require('./redisPubSub.service');

class RoomService {
    static async createRoom({ password, hostId, maxPlayers }) {
        if (!hostId || !password || !maxPlayers) {
            throw new BadRequestError({ message: 'Missing required fields' });
        }
        if (maxPlayers > 4) throw new BadRequestError({ message: 'Max players exceeded!' });

        const newRoom = await RoomModel.create({ password, hostId, maxPlayers, players: [hostId] });
        if (!newRoom) {
            throw new BadRequestError({ message: 'Create new room failed!' });
        }
        return getInfoData({
            fields: ['_id', 'status', 'maxPlayers', 'hostId'],
            object: newRoom,
        });
    }

    static async getRoomById({ roomId }) {
        if (!roomId) {
            throw new BadRequestError({ message: 'Missing required fields' });
        }
        const room = await RoomModel.findOne({ _id: roomId }, { players: 0 });
        if (!room) {
            throw new NotFoundError();
        }
        return getInfoData({
            fields: ['_id', 'status', 'maxPlayers', 'hostId'],
            object: room,
        });
    }

    static async accessRoom({ roomId, password, playerId }) {
        if (!roomId || !password || !playerId) {
            throw new BadRequestError({ message: 'Missing required fields' });
        }

        const room = await RoomModel.findOneAndUpdate(
            { _id: roomId, password },
            { $push: { players: playerId } },
            { new: true } // Return updated document
        );

        if (!room) {
            throw new BadRequestError({ message: 'Wrong password or room not found!' });
        }

        await redisPubSubService.publish(roomId, { message: 'New user joined!', playerId });

        return getInfoData({
            fields: ['_id', 'status', 'maxPlayers', 'hostId'],
            object: room,
        });
    }

    static async accessRoomSocket({ roomId, onRoomEvent }) {
        const dbRoom = await RoomModel.findOne({ _id: roomId }, { _id: 1, players: 1 })
        if (!dbRoom) throw new BadRequestError('Room not found');

        redisPubSubService.subscribe(roomId, (ch, message) => {
            console.log(`Room[${ch}] has new player joined: `, message);
            if (onRoomEvent) {
                onRoomEvent(message);
            }
        });

        const channel = `room:${roomId}`;
        const players = await redisPubSubService.getPlayersInChannel(channel);

        return players;
    }
}

module.exports = RoomService;