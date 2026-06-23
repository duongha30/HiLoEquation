import { BadRequestError, NotFoundError, UnauthorizedError } from '../core/error.response';
import bcrypt from 'bcrypt';
import RoomModel from '../models/Room.model';
import PlayerModel from '../models/Player.model';
import { getInfoData } from '../utils';
import redisPubSubService from './redisPubSub.service';
import { v4 } from 'uuid';
import { Types } from 'mongoose';

class RoomService {
    static async createRoom({ password, hostId, maxPlayers }: { password?: string; hostId: string; maxPlayers: number }) {
        if (!hostId || !maxPlayers) throw new BadRequestError({ message: 'Missing required fields' });
        if (maxPlayers > 4) throw new BadRequestError({ message: 'Max players exceeded!' });

        const code = v4().replace(/-/g, '').slice(0, 6).toUpperCase();
        const passwordHash = await bcrypt.hash(password ?? '0000', 10);
        const newRoom = await RoomModel.create({
            roomCode: code,
            password: passwordHash,
            hostId,
            maxPlayers,
            players: [new Types.ObjectId(hostId)],
        });
        if (!newRoom) throw new BadRequestError({ message: 'Create new room failed!' });

        return getInfoData({
            fields: ['_id', 'roomCode', 'maxPlayers', 'hostId'],
            object: newRoom as unknown as Record<string, unknown>,
        });
    }

    static async getRoomById({ roomId }: { roomId: string }) {
        if (!roomId) throw new BadRequestError({ message: 'Missing required fields' });

        const room = await RoomModel.findOne({ _id: roomId }, { players: 0 });
        if (!room) throw new NotFoundError();

        return getInfoData({
            fields: ['_id', 'maxPlayers', 'hostId', 'roomCode'],
            object: room as unknown as Record<string, unknown>,
        });
    }

    static async accessRoom({ roomCode, password, playerId }: { roomCode: string; password?: string; playerId: string }) {
        if (!roomCode || !playerId) throw new BadRequestError({ message: 'Missing required fields' });

        const room = await RoomModel.findOneAndUpdate({ roomCode }, { $addToSet: { players: new Types.ObjectId(playerId) } }).lean();
        if (!room) throw new BadRequestError({ message: 'Room not found!' });

        const accessPassword = password ?? '0000';
        const isMatching = await bcrypt.compare(accessPassword, room.password);
        if (!isMatching) throw new UnauthorizedError({ message: 'Authentication error' });

        await redisPubSubService.publish(roomCode, { message: 'New user joined!', playerId });

        return getInfoData({
            fields: ['_id', 'maxPlayers', 'hostId', 'roomCode'],
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
        const players = await redisPubSubService.getPlayersInChannel(channel);
        const playerNames = await RoomService.getPlayerNames(players);
        return { players, playerNames };
    }

    static async getPlayerNames(playerIds: string[]): Promise<Record<string, string>> {
        if (!playerIds || playerIds.length === 0) return {};
        const validIds = playerIds.filter((id) => Types.ObjectId.isValid(id));
        const players = await PlayerModel.find({ _id: { $in: validIds } }, { _id: 1, name: 1 }).lean();
        const playerNames: Record<string, string> = {};
        for (const player of players) {
            playerNames[String(player._id)] = player.name as string;
        }
        return playerNames;
    }

    static async leaveRoomSocket({ roomCode, playerId }: { roomCode: string; playerId: string }) {
        if (!roomCode || !playerId) throw new BadRequestError({ message: 'Missing required fields' });
        await redisPubSubService.unsubscribe(roomCode, playerId);
    }

    static async removePlayerFromRoom({ roomCode, playerId }: { roomCode: string; playerId: string }) {
        if (!roomCode || !playerId || !Types.ObjectId.isValid(playerId)) return;
        await RoomModel.updateOne({ roomCode }, { $pull: { players: new Types.ObjectId(playerId) } });
        await PlayerModel.updateOne({ _id: playerId }, { $set: { currentRoomId: null } });
    }
}

export default RoomService;
