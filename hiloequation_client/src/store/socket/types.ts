export type SocketPlayerJoin = {
    playerId: string;
    status: string;
    message: string;
    players: string[];
    playerNames?: Record<string, string>;
}