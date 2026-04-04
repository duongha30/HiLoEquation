'use strict';

const test = {
    app: {
        port: 3001,
    },
    db: {
        host: 'localhost',
        port: 27017,
        name: 'ecommerce_test',
    }
};

const dev = {
    app: {
        port: process.env.DEV_PORT || 3001,
    },
    db: {
        host: process.env.DB_DEV_HOST || 'localhost',
        port: process.env.DB_DEV_PORT || 27017,
        name: process.env.DB_DEV_NAME || 'mongoHilo_dev',
    }
};

const prod = {
    app: {
        port: process.env.PROD_PORT || 3001,
    },
    db: {
        host: process.env.DB_PROD_HOST || 'localhost',
        port: process.env.DB_PROD_PORT || 27017,
        name: process.env.DB_PROD_NAME || 'mongoHilo_prod',
    }
};

const config = {
    dev: dev,
    prod: prod,
    test: test,
    default: dev,
};
const env = process.env.NODE_ENV || 'dev';

module.exports = config[env];