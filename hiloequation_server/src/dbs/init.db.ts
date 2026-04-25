import mongoose from 'mongoose';
import config from '../config/config.mongodb';
import { countConnect } from '../helpers/check.connect';

const { host, name, port } = config.db;
const connectString = `mongodb://${host}:${port}/${name}`;

class Database {
    private static instance: Database;

    constructor() {
        this.connect();
    }

    connect(_type = 'mongodb') {
        mongoose
            .connect(connectString, { maxPoolSize: 10 })
            .then(() => {
                console.log('MongoDB connected', countConnect());
            })
            .catch((err) => {
                console.error('MongoDB connection error:', err);
            });
    }

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}

const instanceMongoDB = Database.getInstance();
export default instanceMongoDB;
