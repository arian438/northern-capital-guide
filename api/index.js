const path = require('path');

// Подключаем зависимости бэкенда при запуске serverless-функции Vercel
module.paths.unshift(path.join(__dirname, '../backend/node_modules'));

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

module.exports = require('../backend/src/app');
