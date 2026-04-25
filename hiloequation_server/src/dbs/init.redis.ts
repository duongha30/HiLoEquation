import { createClient } from 'redis';

const client = createClient({
    url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`,
});

client.connect().catch((err) => console.error('Redis connect error:', err));

client.on('connect', () => {
    console.log('Redis client connected with URL');
});

client.on('error', (error) => {
    console.log('Redis connection error: ', error);
});

export default client;
