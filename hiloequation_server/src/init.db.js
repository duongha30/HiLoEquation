'use strict';

const mongoose = require('mongoose');
const { db } = require('./config/config.mongodb');
const { countConnect } = require('./helpers/check.connect');
const { host, name, port } = db;
const connectString = `mongodb://${host}:${port}/${name}`;

class Database { //Singleton class to ensure only one instance of the database connection is created
    constructor() {
        this.connect();
    }

    connect(type = 'mongodb') {
        mongoose.connect(connectString, {
            maxPoolSize: 10, // Maximum number of connections in the pool
        }).then(() => {
            console.log('MongoDB connected', countConnect());
        })
            .catch((err) => {
                console.error('MongoDB connection error:', err);
            });
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}

const instanceMongoDB = Database.getInstance();
module.exports = instanceMongoDB;