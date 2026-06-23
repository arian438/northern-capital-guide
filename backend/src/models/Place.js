const { query } = require('../config/database');
const { withPlacesFallback, fallback } = require('../utils/placesData');

class Place {
    static async findAll(filters = {}) {
        return withPlacesFallback(async () => {
            let conditions = [];
            let values = [];
            let paramCount = 1;

            if (filters.category && filters.category !== 'all') {
                conditions.push(`category = $${paramCount}`);
                values.push(filters.category);
                paramCount++;
            }

            if (filters.search) {
                conditions.push(`(name ILIKE $${paramCount} OR short_desc ILIKE $${paramCount})`);
                values.push(`%${filters.search}%`);
                paramCount++;
            }

            if (filters.minRating) {
                conditions.push(`rating >= $${paramCount}`);
                values.push(filters.minRating);
                paramCount++;
            }

            let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            let orderClause = 'ORDER BY id';
            if (filters.sortBy === 'name') {
                orderClause = 'ORDER BY name ASC';
            } else if (filters.sortBy === 'nameDesc') {
                orderClause = 'ORDER BY name DESC';
            } else if (filters.sortBy === 'rating') {
                orderClause = 'ORDER BY rating DESC NULLS LAST';
            } else if (filters.sortBy === 'popular') {
                orderClause = 'ORDER BY reviews_count DESC';
            }

            const limit = filters.limit || 50;
            const offset = filters.offset || 0;
            values.push(limit, offset);

            const result = await query(
                `SELECT id, name, category, short_desc, full_desc, address, metro, 
                        hours, lat, lng, photo_url, rating, reviews_count, created_at
                 FROM places
                 ${whereClause}
                 ${orderClause}
                 LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
                values
            );

            return result.rows;
        }, () => fallback.findAll(filters));
    }

    static async countAll(filters = {}) {
        return withPlacesFallback(async () => {
            const result = await query('SELECT COUNT(*) FROM places');
            return parseInt(result.rows[0].count, 10);
        }, () => fallback.countAll());
    }

    static async findById(id) {
        return withPlacesFallback(async () => {
            const result = await query(
                `SELECT id, name, category, short_desc, full_desc, address, metro, 
                        hours, lat, lng, photo_url, rating, reviews_count, created_at, updated_at
                 FROM places WHERE id = $1`,
                [id]
            );
            return result.rows[0];
        }, () => fallback.findById(id));
    }

    static async create(placeData) {
        const { 
            name, category, shortDesc, fullDesc, address, metro, 
            hours, lat, lng, photoUrl, createdBy 
        } = placeData;

        const result = await query(
            `INSERT INTO places (name, category, short_desc, full_desc, address, metro, 
                                hours, lat, lng, photo_url, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [name, category, shortDesc, fullDesc, address, metro, hours, lat, lng, photoUrl, createdBy]
        );
        
        return result.rows[0];
    }

    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        const fieldMap = {
            name: 'name',
            category: 'category',
            shortDesc: 'short_desc',
            fullDesc: 'full_desc',
            address: 'address',
            metro: 'metro',
            hours: 'hours',
            lat: 'lat',
            lng: 'lng',
            photoUrl: 'photo_url'
        };

        for (const [key, dbField] of Object.entries(fieldMap)) {
            if (updates[key] !== undefined) {
                fields.push(`${dbField} = $${paramCount}`);
                values.push(updates[key]);
                paramCount++;
            }
        }

        if (fields.length === 0) {
            return await Place.findById(id);
        }

        values.push(id);
        const result = await query(
            `UPDATE places 
             SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${paramCount}
             RETURNING *`,
            values
        );
        
        return result.rows[0];
    }

    static async delete(id) {
        const result = await query(
            'DELETE FROM places WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async getNearby(lat, lng, radius = 0.02) {
        return withPlacesFallback(async () => {
            const result = await query(
                `SELECT id, name, category, short_desc, address, metro, 
                        photo_url, rating, lat, lng,
                        ( 6371 * acos( cos( radians($1) ) * cos( radians(lat) ) * 
                          cos( radians(lng) - radians($2) ) + sin( radians($1) ) * sin( radians(lat) ) ) ) 
                        AS distance
                 FROM places
                 WHERE ( 6371 * acos( cos( radians($1) ) * cos( radians(lat) ) * 
                        cos( radians(lng) - radians($2) ) + sin( radians($1) ) * sin( radians(lat) ) ) ) < $3
                 ORDER BY distance
                 LIMIT 20`,
                [lat, lng, radius]
            );
            return result.rows;
        }, () => fallback.getNearby(lat, lng, radius));
    }
}

module.exports = Place;
