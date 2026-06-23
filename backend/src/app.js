const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Безопасность
app.use(helmet({
    contentSecurityPolicy: false // Для разработки
}));

// CORS — на Vercel фронтенд и API на одном домене; для превью и локальной разработки разрешаем доп. origins
function isAllowedOrigin(origin) {
    if (!origin) return true;

    const allowed = [
        process.env.FRONTEND_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
        process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null,
        `http://localhost:${process.env.PORT || 5000}`,
        'http://localhost:3000'
    ].filter(Boolean);

    return allowed.includes(origin) || origin.endsWith('.vercel.app');
}

app.use(cors({
    origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
            callback(null, origin || true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // 100 запросов
    message: {
        success: false,
        message: 'Слишком много запросов, попробуйте позже'
    }
});
app.use('/api', limiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../../frontend')));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Маршруты
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/places', require('./routes/placeRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));

// Health check
app.get('/health', async (req, res) => {
    const { pool } = require('./config/database');
    const { fallback } = require('./utils/placesData');

    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected',
            dataSource: 'database',
            placesCount: await fallback.countAll(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            status: 'ok',
            database: 'disconnected',
            dataSource: 'static',
            placesCount: fallback.countAll(),
            message: process.env.NODE_ENV === 'production'
                ? 'Работает на встроенных данных (без облачной БД)'
                : error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Маршрут не найден'
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Ошибка валидации',
            errors: err.errors
        });
    }

    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            message: 'Запись уже существует'
        });
    }

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Внутренняя ошибка сервера' 
            : err.message
    });
});

module.exports = app;