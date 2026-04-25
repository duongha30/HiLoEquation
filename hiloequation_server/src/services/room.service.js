'use strict';

const { BadRequestError, NotFoundError } = require('../core/error.response');
const { OK } = require('../core/success.response');
const RoomModel = require('../models/Room.model');
const { getInfoData } = require('../utils');
const redisPubSubService = require('./redisPubSub.service');
const { v7 } = require('uuid');

class RoomService {
    static async createRoom({ password, hostId, maxPlayers }) {
        if (!hostId || !maxPlayers) {
            throw new BadRequestError({ message: 'Missing required fields' });
        }
        if (maxPlayers > 4) throw new BadRequestError({ message: 'Max players exceeded!' });

        const newRoom = await RoomModel.create({ roomCode: v7().replace(/-/g, '').slice(0, 6).toUpperCase(), password, hostId, maxPlayers, players: [hostId] });
        if (!newRoom) {
            throw new BadRequestError({ message: 'Create new room failed!' });
        }
        return getInfoData({
            fields: ['_id', 'roomCode', 'status', 'maxPlayers', 'hostId'],
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
            fields: ['_id', 'status', 'maxPlayers', 'hostId', 'roomCode'],
            object: room,
        });
    }

    static async accessRoom({ roomCode, password, playerId }) {
        if (!roomCode || !password || !playerId) {
            throw new BadRequestError({ message: 'Missing required fields' });
        }

        const room = await RoomModel.findOneAndUpdate(
            { roomCode: roomCode, password },
            { $push: { players: playerId } },
        );

        if (!room) {
            throw new BadRequestError({ message: 'Wrong password or room not found!' });
        }

        await redisPubSubService.publish(roomCode, { message: 'New user joined!', playerId });

        return getInfoData({
            fields: ['_id', 'status', 'maxPlayers', 'hostId', 'roomCode'],
            object: room,
        });
    }

    static async accessRoomSocket({ roomCode, onRoomEvent }) {
        const dbRoom = await RoomModel.findOne({ roomCode: roomCode }, { _id: 1, roomCode: 1, players: 1 });
        if (!dbRoom) throw new BadRequestError('Room not found');

        await redisPubSubService.subscribe(roomCode, (ch, message) => {
            console.log(`Room[${ch}] has new player joined: `, message);
            if (onRoomEvent) {
                onRoomEvent(message);
            }
        });

        const channel = `room:${roomCode}`;
        const players = await redisPubSubService.getPlayersInChannel(channel);

        return players;
    }
}

module.exports = RoomService;