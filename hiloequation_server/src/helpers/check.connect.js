'use strict';

const mongoose = require('mongoose');
const process = require('process');
const os = require('os');

const MONITORING_INTERVAL = 5000;

const countConnect = () => {
    const numberConnections = mongoose.connections.length;
    console.log('Number of connections: ', numberConnections);
}

const checkOverLoad = () => {
    setInterval(() => {
        const numberConnections = mongoose.connections.length;
        const numCores = os.cpus().length; // CPU cores
        const memoryUsage = process.memoryUsage().rss; // memory usage of the process
        const maxConnections = numCores * 5; // 5 connections per core

        console.log('Active Connections: ', numberConnections)
        console.log('Memory usage: ', memoryUsage / 1024 / 1024, 'MB');
        if (numberConnections > maxConnections) {
            console.log('Connection Overload! ', numberConnections)
        }
    }, MONITORING_INTERVAL);
}

module.exports = { countConnect, checkOverLoad };