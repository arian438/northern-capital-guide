const { query } = require('../config/database');

class Favorite {
    static async add(userId, placeId, note = null) {
        try {
            const result = await query(
                `INSERT INTO favorites (user_id, place_id, note)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, place_id) 
                 DO UPDATE SET note = $3, created_at = CURRENT_TIMESTAMP
                 RETURNING *`,
                [userId, placeId, note]
            );
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                // Уже существует, возвращаем существующую запись
                return await Favorite.get(userId, placeId);
            }
            throw error;
        }
    }

    static async remove(userId, placeId) {
        const result = await query(
            'DELETE FROM favorites WHERE user_id = $1 AND place_id = $2 RETURNING *',
            [userId, placeId]
        );
        return result.rows[0];
    }

    static async get(userId, placeId) {
        const result = await query(
            'SELECT * FROM favorites WHERE user_id = $1 AND place_id = $2',
            [userId, placeId]
        );
        return result.rows[0];
    }

    static async getByUser(userId, filters = {}) {
        let conditions = ['f.user_id = $1'];
        let values = [userId];
        let paramCount = 2;

        if (filters.category && filters.category !== 'all') {
            conditions.push(`p.category = $${paramCount}`);
            values.push(filters.category);
            paramCount++;
        }

        if (filters.search) {
            conditions.push(`(p.name ILIKE $${paramCount} OR p.short_desc ILIKE $${paramCount})`);
            values.push(`%${filters.search}%`);
            paramCount++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const result = await query(
            `SELECT f.id, f.user_id, f.place_id, f.note, f.created_at as favorited_at,
                    p.id as place_id, p.name, p.category, p.short_desc, p.full_desc, 
                    p.address, p.metro, p.hours, p.lat, p.lng, p.photo_url, p.rating, p.reviews_count
             FROM favorites f
             JOIN places p ON f.place_id = p.id
             ${whereClause}
             ORDER BY f.created_at DESC`,
            values
        );
        
        return result.rows;
    }

    static async countByUser(userId) {
        const result = await query(
            'SELECT COUNT(*) as count FROM favorites WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    static async isFavorite(userId, placeId) {
        const result = await query(
            'SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = $1 AND place_id = $2) as exists',
            [userId, placeId]
        );
        return result.rows[0].exists;
    }
}

module.exports = Favorite;