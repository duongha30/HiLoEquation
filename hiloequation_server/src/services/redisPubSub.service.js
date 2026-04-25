'use strict'

const redis = require('redis');
const { BadRequestError } = require('../core/error.response');

class RedisPubSubService {
    constructor() {
        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();
        this.dataClient = redis.createClient();

        this.publisher.on('error', (err) => console.error('Publisher error:', err));
        this.subscriber.on('error', (err) => console.error('Subscriber error:', err));
        this.dataClient.on('error', (err) => console.error('Data client error:', err));

        this.publisher.connect().catch(err => console.error('Publisher connect error:', err));
        this.subscriber.connect().catch(err => console.error('Subscriber connect error:', err));
        this.dataClient.connect().catch(err => console.error('Data client connect error:', err));
    }

    async addPlayerToChannel(channel, playerId) {
        try {
            await this.dataClient.sadd(channel, playerId);
        } catch (error) {
            new BadRequestError({ message: 'Error in add channel in redis' });
        }
    }

    async removePlayerFromChannel(channel, playerId) {
        try {
            await this.dataClient.srem(channel, playerId);
        } catch (error) {
            new BadRequestError({ message: 'Error in remove channel in redis' });
        }
    }

    async getPlayersInChannel(channel) {
        try {
            return await this.dataClient.smembers(channel);
        } catch (error) {
            return new BadRequestError({ message: 'Error in get channel in redis' });
        }
    }

    // redis v4
    async publish(roomCode, message) {
        const channel = `room:${roomCode}`;
        const players = await this.getPlayersInChannel(channel);
        const announcement = { message: message.message, playerId: message.playerId, players };
        const payload = JSON.stringify(announcement);
        const numReceivers = await this.publisher.publish(channel, payload);
        console.log(`Message published to ${channel}. Receivers: ${numReceivers}`);
        return announcement;
    }

    async subscribe(roomCode, callback) {
        const channel = `room:${roomCode}`;
        await this.subscriber.subscribe(channel, async (message, receivedChannel) => {
            try {
                const parsedMessage = JSON.parse(message);
                await this.addPlayerToChannel(receivedChannel, parsedMessage.playerId);
                callback(receivedChannel, parsedMessage);
            } catch (err) {
                console.error('Error parsing message:', err);
                callback(channel, message);
            }
        });
        console.log(`Subscribed to channel: ${channel}`);
    }

    async unsubscribe(roomCode, playerId) {
        try {
            const channel = `room:${roomCode}`;
            await this.removePlayerFromChannel(channel, playerId);
            await this.subscriber.unsubscribe(channel);
            console.log(`Unsubscribed from channel: ${channel}`);
        } catch (error) {
            console.error('Error in unsubscribe channel:', error);
        }
    }

    async unsubscribeAll(roomCode, playerId) {
        const channel = `room:${roomCode}`;
        await this.dataClient.srem(channel, playerId);
        await this.subscriber.unsubscribe();
    }

    async disconnect() {
        await this.publisher.quit();
        await this.subscriber.quit();
        await this.dataClient.quit();
    }
}

module.exports = new RedisPubSubService();
