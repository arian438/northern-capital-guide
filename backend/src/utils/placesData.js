const { query, logger } = require('../config/database');
const fallback = require('./placesFallback');

async function withPlacesFallback(dbFn, fallbackFn) {
    if (!fallback.isDatabaseConfigured()) {
        return fallbackFn();
    }

    try {
        return await dbFn();
    } catch (error) {
        logger.warn('Database unavailable, using static places data:', error.message);
        return fallbackFn();
    }
}

module.exports = { withPlacesFallback, fallback };
