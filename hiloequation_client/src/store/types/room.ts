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

export type CreateRoomResponse = {
    status: string;
    message: string;
    metadata: Room;
};

export type JoinRoomResponse = {
    joinedPlayer: string;
    roomId: string;
    status: number;
};
