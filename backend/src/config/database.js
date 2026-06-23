const { Pool } = require('pg');
const winston = require('winston');

const isServerless = Boolean(process.env.VERCEL);

const transports = [
    new winston.transports.Console({
        format: winston.format.simple()
    })
];

if (!isServerless) {
    transports.push(
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    );
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports
});

function getPoolConfig() {
    const connectionString =
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL;

    if (connectionString) {
        return {
            connectionString,
            ssl: process.env.DB_SSL === 'false'
                ? false
                : { rejectUnauthorized: false },
            max: isServerless ? 1 : 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        };
    }

    return {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: isServerless ? 1 : 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    };
}

const pool = new Pool(getPoolConfig());

pool.on('connect', () => {
    logger.info('Connected to PostgreSQL');
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
});

const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.info('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        logger.error('Query error', { text, error: error.message });
        throw error;
    }
};

const getClient = () => pool.connect();

module.exports = {
    query,
    getClient,
    pool,
    logger
};
