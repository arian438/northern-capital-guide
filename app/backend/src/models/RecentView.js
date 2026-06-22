const { query } = require('../config/database');

class RecentView {
    static async add(userId, placeId) {
        // Удаляем старую запись, если есть
        await query(
            'DELETE FROM recent_views WHERE user_id = $1 AND place_id = $2',
            [userId, placeId]
        );

        // Добавляем новую
        const result = await query(
            `INSERT INTO recent_views (user_id, place_id)
             VALUES ($1, $2)
             RETURNING *`,
            [userId, placeId]
        );

        // Оставляем только последние 20 просмотров
        await query(
            `DELETE FROM recent_views 
             WHERE id IN (
                 SELECT id FROM recent_views 
                 WHERE user_id = $1 
                 ORDER BY viewed_at DESC 
                 OFFSET 20
             )`,
            [userId]
        );

        return result.rows[0];
    }

    static async getByUser(userId, limit = 10) {
        const result = await query(
            `SELECT rv.id, rv.viewed_at,
                    p.id as place_id, p.name, p.category, p.short_desc, p.full_desc, 
                    p.address, p.metro, p.hours, p.lat, p.lng, p.photo_url, p.rating, p.reviews_count
             FROM recent_views rv
             JOIN places p ON rv.place_id = p.id
             WHERE rv.user_id = $1
             ORDER BY rv.viewed_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    static async clear(userId) {
        await query(
            'DELETE FROM recent_views WHERE user_id = $1',
            [userId]
        );
    }
}

module.exports = RecentView;