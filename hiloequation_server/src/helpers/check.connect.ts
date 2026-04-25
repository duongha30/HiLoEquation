import mongoose from 'mongoose';
import process from 'process';
import os from 'os';

const MONITORING_INTERVAL = 5000;

const countConnect = () => {
    const numberConnections = mongoose.connections.length;
    console.log('Number of connections: ', numberConnections);
};

const checkOverLoad = () => {
    setInterval(() => {
        const numberConnections = mongoose.connections.length;
        const numCores = os.cpus().length;
        const memoryUsage = process.memoryUsage().rss;
        const maxConnections = numCores * 5;

        console.log('Active Connections: ', numberConnections);
        console.log('Memory usage: ', memoryUsage / 1024 / 1024, 'MB');
        if (numberConnections > maxConnections) {
            console.log('Connection Overload! ', numberConnections);
        }
    }, MONITORING_INTERVAL);
};

export { countConnect, checkOverLoad };
