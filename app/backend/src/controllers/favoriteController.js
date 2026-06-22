const Favorite = require('../models/Favorite');
const { logger } = require('../config/database');

exports.getFavorites = async (req, res) => {
    try {
        const { category, search } = req.query;
        
        const favorites = await Favorite.getByUser(req.user.id, { category, search });

        res.json({
            success: true,
            data: favorites
        });
    } catch (error) {
        logger.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении избранного'
        });
    }
};

exports.addFavorite = async (req, res) => {
    try {
        const { placeId } = req.params;
        const { note } = req.body;

        const favorite = await Favorite.add(req.user.id, placeId, note);

        res.json({
            success: true,
            message: 'Место добавлено в избранное',
            data: favorite
        });
    } catch (error) {
        logger.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при добавлении в избранное'
        });
    }
};

exports.removeFavorite = async (req, res) => {
    try {
        const { placeId } = req.params;

        const favorite = await Favorite.remove(req.user.id, placeId);
        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Место не найдено в избранном'
            });
        }

        res.json({
            success: true,
            message: 'Место удалено из избранного'
        });
    } catch (error) {
        logger.error('Remove favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при удалении из избранного'
        });
    }
};

exports.checkFavorite = async (req, res) => {
    try {
        const { placeId } = req.params;

        const isFavorite = await Favorite.isFavorite(req.user.id, placeId);

        res.json({
            success: true,
            data: { isFavorite }
        });
    } catch (error) {
        logger.error('Check favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при проверке избранного'
        });
    }
};