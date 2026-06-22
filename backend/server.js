// server.js
require('dotenv').config(); // <-- ДОБАВЬТЕ ЭТУ СТРОКУ В САМОМ НАЧАЛЕ

const app = require('./src/app');
const { pool, logger } = require('./src/config/database');
const net = require('net');

// Функция для проверки, занят ли порт
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer()
            .once('error', () => resolve(false))
            .once('listening', () => {
                server.close();
                resolve(true);
            })
            .listen(port);
    });
}

// Функция для поиска свободного порта
async function findAvailablePort(startPort, maxAttempts = 10) {
    let port = startPort;
    for (let i = 0; i < maxAttempts; i++) {
        if (await isPortAvailable(port)) {
            return port;
        }
        port++;
    }
    throw new Error(`Не удалось найти свободный порт после ${maxAttempts} попыток`);
}

// Функция для запуска сервера
async function startServer() {
    try {
        // Проверяем подключение к БД
        const client = await pool.connect();
        logger.info('Database connection established');
        client.release();

        // Ищем свободный порт
        const desiredPort = parseInt(process.env.PORT) || 5000;
        const port = await findAvailablePort(desiredPort);
        
        if (port !== desiredPort) {
            logger.warn(`Порт ${desiredPort} занят, использую порт ${port}`);
        }

        // Запускаем сервер
        const server = app.listen(port, () => {
            logger.info(`🚀 Server running on port ${port}`);
            logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            logger.info(`🔗 API URL: http://localhost:${port}/api`);
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

        return server;

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Запускаем сервер
startServer();

module.exports = startServer;