const { createClient } = require('redis');
const client = createClient({
    url: `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

client.ping((error, res) => {
    console.log('res', res);
});

client.on('connect', () => {
    console.log('Redis client connected with URL');
});

client.on("error", (error) => {
    console.log("Redis connection error: ", error);
});

module.exports = client;