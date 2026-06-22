const Place = require('../models/Place');
const Favorite = require('../models/Favorite');
const RecentView = require('../models/RecentView');
const { query, logger } = require('../config/database');

exports.getPlaces = async (req, res) => {
    try {
        const { 
            category, search, sortBy, minRating, 
            limit = 50, offset = 0 
        } = req.query;

        const filters = {
            category: category || 'all',
            search: search || '',
            sortBy: sortBy || 'default',
            minRating: minRating ? parseFloat(minRating) : null,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        const places = await Place.findAll(filters);
        const total = await query(
            'SELECT COUNT(*) FROM places'
        );

        res.json({
            success: true,
            data: places,
            pagination: {
                limit: filters.limit,
                offset: filters.offset,
                total: parseInt(total.rows[0].count)
            }
        });
    } catch (error) {
        logger.error('Get places error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении мест'
        });
    }
};

exports.getPlaceById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const place = await Place.findById(id);
        if (!place) {
            return res.status(404).json({
                success: false,
                message: 'Место не найдено'
            });
        }

        // Добавляем в историю просмотров, если пользователь авторизован
        if (req.user) {
            await RecentView.add(req.user.id, id);
        }

        // Получаем отзывы
        const reviews = await query(
            `SELECT r.*, u.username, u.full_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.place_id = $1 AND r.is_approved = TRUE
             ORDER BY r.created_at DESC
             LIMIT 20`,
            [id]
        );

        // Проверяем, в избранном ли у пользователя
        let isFavorite = false;
        if (req.user) {
            isFavorite = await Favorite.isFavorite(req.user.id, id);
        }

        res.json({
            success: true,
            data: {
                ...place,
                isFavorite,
                reviews: reviews.rows
            }
        });
    } catch (error) {
        logger.error('Get place by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении места'
        });
    }
};

exports.createPlace = async (req, res) => {
    try {
        const placeData = {
            ...req.body,
            createdBy: req.user.id
        };

        const place = await Place.create(placeData);

        // Логирование
        await query(
            `INSERT INTO user_activity_logs (user_id, action_type, action_details)
             VALUES ($1, $2, $3)`,
            [req.user.id, 'create_place', { place_id: place.id, name: place.name }]
        );

        res.status(201).json({
            success: true,
            message: 'Место успешно создано',
            data: place
        });
    } catch (error) {
        logger.error('Create place error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при создании места'
        });
    }
};

exports.updatePlace = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existingPlace = await Place.findById(id);
        if (!existingPlace) {
            return res.status(404).json({
                success: false,
                message: 'Место не найдено'
            });
        }

        // Проверка прав (только admin или создатель)
        if (req.user.role !== 'admin' && existingPlace.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Недостаточно прав для редактирования'
            });
        }

        const place = await Place.update(id, req.body);

        // Логирование
        await query(
            `INSERT INTO user_activity_logs (user_id, action_type, action_details)
             VALUES ($1, $2, $3)`,
            [req.user.id, 'update_place', { place_id: place.id, name: place.name }]
        );

        res.json({
            success: true,
            message: 'Место успешно обновлено',
            data: place
        });
    } catch (error) {
        logger.error('Update place error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при обновлении места'
        });
    }
};

exports.deletePlace = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existingPlace = await Place.findById(id);
        if (!existingPlace) {
            return res.status(404).json({
                success: false,
                message: 'Место не найдено'
            });
        }

        // Проверка прав (только admin)
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Требуются права администратора'
            });
        }

        await Place.delete(id);

        // Логирование
        await query(
            `INSERT INTO user_activity_logs (user_id, action_type, action_details)
             VALUES ($1, $2, $3)`,
            [req.user.id, 'delete_place', { place_id: id, name: existingPlace.name }]
        );

        res.json({
            success: true,
            message: 'Место успешно удалено'
        });
    } catch (error) {
        logger.error('Delete place error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при удалении места'
        });
    }
};

exports.getNearbyPlaces = async (req, res) => {
    try {
        const { lat, lng, radius = 0.02 } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Необходимы координаты (lat, lng)'
            });
        }

        const places = await Place.getNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius));

        res.json({
            success: true,
            data: places
        });
    } catch (error) {
        logger.error('Get nearby places error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении ближайших мест'
        });
    }
};

exports.addReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const place = await Place.findById(id);
        if (!place) {
            return res.status(404).json({
                success: false,
                message: 'Место не найдено'
            });
        }

        // Проверка, не оставлял ли пользователь уже отзыв
        const existingReview = await query(
            'SELECT * FROM reviews WHERE user_id = $1 AND place_id = $2',
            [req.user.id, id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Вы уже оставили отзыв на это место'
            });
        }

        const result = await query(
            `INSERT INTO reviews (user_id, place_id, rating, comment, is_approved)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [req.user.id, id, rating, comment, true] // В продакшене нужно модерация
        );

        // Логирование
        await query(
            `INSERT INTO user_activity_logs (user_id, action_type, action_details)
             VALUES ($1, $2, $3)`,
            [req.user.id, 'add_review', { place_id: id, rating }]
        );

        res.status(201).json({
            success: true,
            message: 'Отзыв успешно добавлен',
            data: result.rows[0]
        });
    } catch (error) {
        logger.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при добавлении отзыва'
        });
    }
};

exports.getReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const result = await query(
            `SELECT r.*, u.username, u.full_name, u.avatar_url
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.place_id = $1 AND r.is_approved = TRUE
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [id, parseInt(limit), parseInt(offset)]
        );

        const total = await query(
            'SELECT COUNT(*) FROM reviews WHERE place_id = $1 AND is_approved = TRUE',
            [id]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: parseInt(total.rows[0].count)
            }
        });
    } catch (error) {
        logger.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении отзывов'
        });
    }
};