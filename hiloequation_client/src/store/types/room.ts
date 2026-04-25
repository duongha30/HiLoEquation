export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED';

export type Room = {
    roomId: string;
    status: 'idle' | 'loading' | 'failed';
    roomStatus: RoomStatus;
    maxPlayers: number;
    hostId: string;
    players: string[];
};

export type CreateRoomPayload = {
    password?: string;
    hostId: string;
    maxPlayers?: number;
};

type Players = { players: string[] };

export type RoomDB = {
    _id: string;
    status: 'active' | 'inactive';
    maxPlayers: number;
    hostId: string;
    roomCode: string;
};

export type CreateRoomResponse = {
    status: string;
    message: string;
    metadata: RoomDB & Players;
};

export type FetchRoomsResponse = {
    _id: string,
    status: string,
    maxPlayers: number,
    hostId: string,
    players: string[],
};

export type JoinRoomResponse = {
    status: string;
    message: string;
    metadata: RoomDB;
};
