import { createClient } from 'redis';
import { BadRequestError } from '../core/error.response';

type RedisClient = ReturnType<typeof createClient>;
type MessageCallback = (channel: string, message: unknown) => void;

class RedisPubSubService {
    private publisher: RedisClient;
    private subscriber: RedisClient;
    private dataClient: RedisClient;

    constructor() {
        this.publisher = createClient();
        this.subscriber = createClient();
        this.dataClient = createClient();

        this.publisher.on('error', (err) => console.error('Publisher error:', err));
        this.subscriber.on('error', (err) => console.error('Subscriber error:', err));
        this.dataClient.on('error', (err) => console.error('Data client error:', err));

        this.publisher.connect().catch((err) => console.error('Publisher connect error:', err));
        this.subscriber.connect().catch((err) => console.error('Subscriber connect error:', err));
        this.dataClient.connect().catch((err) => console.error('Data client connect error:', err));
    }

    async addPlayerToChannel(channel: string, playerId: string) {
        await this.dataClient.SADD(channel, String(playerId));
    }

    async removePlayerFromChannel(channel: string, playerId: string) {
        await this.dataClient.SREM(channel, String(playerId));
    }

    async getPlayersInChannel(channel: string): Promise<string[]> {
        return await this.dataClient.SMEMBERS(channel);
    }

    async publish(roomCode: string, message: { message: string; playerId: string }) {
        try {
            const channel = `room:${roomCode}`;
            const players = await this.getPlayersInChannel(channel);
            const announcement = { message: message.message, playerId: message.playerId, players };
            const payload = JSON.stringify(announcement);
            const numReceivers = await this.publisher.publish(channel, payload);
            console.log(`Message published to ${channel}. Receivers: ${numReceivers}`);
            return announcement;
        } catch (error) {
            console.error('Error publishing message:', error);
            throw new BadRequestError({ message: 'Error in publish channel in redis' });
        }
    }

    async subscribe(roomCode: string, callback: MessageCallback) {
        const channel = `room:${roomCode}`;
        await this.subscriber.subscribe(channel, async (message: string, receivedChannel: string) => {
            try {
                console.log(`Subscribing to channel: ${channel}`);
                const parsedMessage = JSON.parse(message);
                callback(receivedChannel, parsedMessage);
            } catch (err) {
                console.error('Error parsing message:', err);
                callback(channel, message);
            }
        });
    }

    async unsubscribe(roomCode: string, playerId: string) {
        try {
            const channel = `room:${roomCode}`;
            await this.removePlayerFromChannel(channel, playerId);
            await this.subscriber.unsubscribe(channel);
            console.log(`Unsubscribed from channel: ${channel}`);
        } catch (error) {
            console.error('Error in unsubscribe channel:', error);
        }
    }

    async unsubscribeAll(roomCode: string, playerId: string) {
        const channel = `room:${roomCode}`;
        await this.dataClient.SREM(channel, playerId);
        await this.subscriber.unsubscribe();
    }

    async disconnect() {
        await this.publisher.quit();
        await this.subscriber.quit();
        await this.dataClient.quit();
    }
}

export default new RedisPubSubService();
