"use strict"

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/index.js";

const dev = {
    database_url: process.env.DATABASE_URL_DEV || ''
};
const prod = {
    database_url: process.env.DATABASE_URL_PROD || ''
};
export const config = { dev, prod };
const env = process.env.NODE_ENV || 'dev';
const connectionString = `${config[env]}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

class Database {
    constructor(type = 'mongo') {
        this.connect(type);
    }

    connect(type) {
        if (type === 'mongodb') {
            //mongo
        } else if (type === 'postgresql') {
            try {
                prisma.$connect()
                console.log("database connected!")
            } catch (error) {
                console.log('error in database connection: ', error)
            }
        }
    }

    disconnect() {
        if (type === 'mongodb') {
            //mongo
        } else if (type === 'postgresql') {
            try {
                prisma.$disconnect();
            } catch (error) {
                console.log('error in database disconnection: ', error)
                prisma.$disconnect();
                process.exit(1);
            }
        }
    }

    static getInstance(type) {
        if (!Database.instance) {
            Database.instance = new Database(type);
        }

        return Database.instance;
    }
}


export const instanceDB = Database.getInstance("postgresql");