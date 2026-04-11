export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED';

export type Room = {
    _id: string;
    status: RoomStatus;
    maxPlayers: number;
    hostId: string;
    players: string[];
};

export type CreateRoomPayload = {
    password?: string;
    hostId: string;
    maxPlayers?: number;
};

export type CreateRoomResponse = {
    status: string;
    message: string;
    metadata: Room;
};
