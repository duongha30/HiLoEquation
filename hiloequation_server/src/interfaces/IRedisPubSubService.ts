export type MessageCallback = (channel: string, message: unknown) => void;

export interface PublishMessage {
    message: string;
    playerId: string;
}

export interface PublishResult {
    message: string;
    playerId: string;
    players: string[];
}

export interface IRedisPubSubService {
    addPlayerToChannel(channel: string, playerId: string): Promise<void>;
    removePlayerFromChannel(channel: string, playerId: string): Promise<void>;
    getPlayersInChannel(channel: string): Promise<string[]>;
    publish(roomCode: string, message: PublishMessage): Promise<PublishResult>;
    subscribe(roomCode: string, callback: MessageCallback): Promise<void>;
    unsubscribe(roomCode: string, playerId: string): Promise<void>;
    unsubscribeAll(roomCode: string, playerId: string): Promise<void>;
    disconnect(): Promise<void>;
}
