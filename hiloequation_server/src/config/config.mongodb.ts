interface AppConfig {
    app: { port: number | string };
    db: { host: string; port: number | string; name: string };
}

const test: AppConfig = {
    app: { port: 3001 },
    db: { host: 'localhost', port: 27017, name: 'ecommerce_test' },
};

const dev: AppConfig = {
    app: { port: process.env.DEV_PORT || 3001 },
    db: {
        host: process.env.DB_DEV_HOST || 'localhost',
        port: process.env.DB_DEV_PORT || 27017,
        name: process.env.DB_DEV_NAME || 'mongoHilo_dev',
    },
};

const prod: AppConfig = {
    app: { port: process.env.PROD_PORT || 3001 },
    db: {
        host: process.env.DB_PROD_HOST || 'localhost',
        port: process.env.DB_PROD_PORT || 27017,
        name: process.env.DB_PROD_NAME || 'mongoHilo_prod',
    },
};

const config: Record<string, AppConfig> = { dev, prod, test, default: dev };
const env = process.env.NODE_ENV || 'dev';

export default config[env];
