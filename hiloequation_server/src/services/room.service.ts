import { BadRequestError, NotFoundError } from '../core/error.response';
import RoomModel from '../models/Room.model';
import { getInfoData } from '../utils';
import redisPubSubService from './redisPubSub.service';
import { v7 } from 'uuid';
import { Types } from 'mongoose';

class RoomService {
    static async createRoom({ password, hostId, maxPlayers }: { password?: string; hostId: string; maxPlayers: number }) {
        if (!hostId || !maxPlayers) throw new BadRequestError({ message: 'Missing required fields' });
        if (maxPlayers > 4) throw new BadRequestError({ message: 'Max players exceeded!' });

        const code = v7().replace(/-/g, '').slice(0, 6).toUpperCase();
        const newRoom = await RoomModel.create({
            roomCode: code,
            password,
            hostId,
            maxPlayers,
            players: [new Types.ObjectId(hostId)],
        });
        if (!newRoom) throw new BadRequestError({ message: 'Create new room failed!' });

        return getInfoData({
            fields: ['_id', 'roomCode', 'status', 'maxPlayers', 'hostId'],
            object: newRoom as unknown as Record<string, unknown>,
        });
    }

    static async getRoomById({ roomId }: { roomId: string }) {
        if (!roomId) throw new BadRequestError({ message: 'Missing required fields' });

        const room = await RoomModel.findOne({ _id: roomId }, { players: 0 });
        if (!room) throw new NotFoundError();

        return getInfoData({
            fields: ['_id', 'status', 'maxPlayers', 'hostId', 'roomCode'],
            object: room as unknown as Record<string, unknown>,
        });
    }

    static async accessRoom({ roomCode, password, playerId }: { roomCode: string; password?: string; playerId: string }) {
        if (!roomCode || !playerId) throw new BadRequestError({ message: 'Missing required fields' });

        const room = await RoomModel.findOneAndUpdate(
            { roomCode, password, players: { $ne: new Types.ObjectId(playerId) } },
            { $addToSet: { players: new Types.ObjectId(playerId) } },
        );

        if (!room) throw new BadRequestError({ message: 'Wrong password or room not found!' });

        await redisPubSubService.publish(roomCode, { message: 'New user joined!', playerId });

        return getInfoData({
            fields: ['_id', 'status', 'maxPlayers', 'hostId', 'roomCode'],
            object: room as unknown as Record<string, unknown>,
        });
    }

    static async accessRoomSocket({ roomCode, onRoomEvent, playerId }: {
        roomCode: string;
        onRoomEvent?: (message: unknown) => void;
        playerId: string;
    }) {
        const dbRoom = await RoomModel.findOne({ roomCode }, { _id: 1, roomCode: 1, players: 1 });
        if (!dbRoom) throw new BadRequestError({ message: 'Room not found' });

        await redisPubSubService.subscribe(roomCode, (ch: string, message: unknown) => {
            console.log(`Room[${ch}] has new player joined: `, message);
            if (onRoomEvent) onRoomEvent(message);
        });

        const channel = `room:${roomCode}`;
        await redisPubSubService.addPlayerToChannel(channel, playerId);
        return await redisPubSubService.getPlayersInChannel(channel);
    }

    static async leaveRoomSocket({ roomCode, playerId }: { roomCode: string; playerId: string }) {
        if (!roomCode || !playerId) throw new BadRequestError({ message: 'Missing required fields' });
        await redisPubSubService.unsubscribe(roomCode, playerId);
    }
}

export default RoomService;
