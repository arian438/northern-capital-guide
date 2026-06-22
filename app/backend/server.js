const app = require('./src/app');
const { pool, logger } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Проверка подключения к БД
pool.connect((err, client, release) => {
    if (err) {
        logger.error('Failed to connect to database:', err);
        process.exit(1);
    }
    logger.info('Database connection established');
    release();
});

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Graceful shutdown
const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    
    server.close(() => {
        logger.info('HTTP server closed');
    });
    
    try {
        await pool.end();
        logger.info('Database pool closed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;