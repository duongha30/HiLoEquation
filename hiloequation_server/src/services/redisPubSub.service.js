'use strict'

const redis = require('redis');

class RedisPubSubService {
    constructor() {
        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();

        this.dataClient = redis.createClient();
        this.dataClient.on('error', (error) => {
            console.error('Data Client error: ', error);
        });
    }

    async addPlayerToChannel(channel, playerId) {
        await this.dataClient.SADD(channel, playerId);
    }

    async removePlayerFromChannel(channel, playerId) {
        await this.dataClient.SREM(channel, playerId);
    }

    async getPlayersInChannel(channel) {
        return await this.dataClient.SMEMBERS(channel);
    }

    async publish(roomId, message) {
        return new Promise(async (resolve, reject) => {
            const payload = JSON.stringify(message);
            const channel = `room:${roomId}`;
            this.publisher.publish(channel, payload, async (err, numReceivers) => {
                if (err) {
                    console.error('Publish error:', err);
                    reject(err);
                } else {
                    console.log(`Message published to ${channel}. Receivers: ${numReceivers}`);
                    try {
                        const players = await this.getPlayersInChannel(channel);
                        resolve({
                            message: message.message,
                            playerId: message.playerId,
                            players
                        });
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        });
    }

    subscribe(roomId, callback) {
        const channel = `room:${roomId}`;
        this.subscriber.subscribe(channel, (err) => {
            if (err) {
                console.error(`Failed to subscribe to ${channel}:`, err);
            } else {
                console.log(`Subscribed to channel: ${channel}`);
            }
        });

        this.subscriber.on('message', async (receivedChannel, message) => {
            if (receivedChannel === channel) {
                try {
                    const parsedMessage = JSON.parse(message);
                    await this.addPlayerToChannel(channel, parsedMessage.playerId);
                    callback(receivedChannel, parsedMessage);
                } catch (err) {
                    console.error('Error parsing message:', err);
                    callback(receivedChannel, message);
                }
            }
        });

        this.subscriber.on('error', (err) => {
            console.error('Subscriber error:', err);
        });
    }

    async unsubscribe(roomId, playerId) {
        try {
            const channel = `room:${roomId}`;
            await this.removePlayerFromChannel(channel, playerId)

            this.subscriber.unsubscribe(channel, (err) => {
                if (err) {
                    console.error(`Failed to unsubscribe from ${channel}:`, err);
                } else {
                    console.log(`Unsubscribed from channel: ${channel}`);
                }
            });
        } catch (error) {
            console.error("Error in unsubscribe channel")
        }
    }

    unsubscribeAll(roomId, playerId) {
        const channel = `room:${roomId}`;
        this.dataClient.SREM(channel, playerId);
        this.subscriber.unsubscribe();
    }

    disconnect() {
        this.publisher.quit();
        this.subscriber.unsubscribe();
        this.subscriber.quit();
        this.dataClient.quit();
    }
}

module.exports = new RedisPubSubService();