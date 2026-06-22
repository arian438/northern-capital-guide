const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { username, email, password, fullName } = userData;
        const passwordHash = await bcrypt.hash(password, 10);
        
        const result = await query(
            `INSERT INTO users (username, email, password_hash, full_name)
             VALUES ($1, $2, $3, $4)
             RETURNING id, username, email, full_name, role, is_active, is_email_verified, created_at`,
            [username, email, passwordHash, fullName]
        );
        
        return result.rows[0];
    }

    static async findByEmail(email) {
        const result = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await query(
            `SELECT id, username, email, full_name, role, is_active, 
                    is_email_verified, last_login_at, created_at, updated_at
             FROM users WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async findByUsername(username) {
        const result = await query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0];
    }

    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updates.fullName) {
            fields.push(`full_name = $${paramCount}`);
            values.push(updates.fullName);
            paramCount++;
        }

        if (updates.email) {
            fields.push(`email = $${paramCount}`);
            values.push(updates.email);
            paramCount++;
        }

        if (updates.password) {
            const hashedPassword = await bcrypt.hash(updates.password, 10);
            fields.push(`password_hash = $${paramCount}`);
            values.push(hashedPassword);
            paramCount++;
        }

        if (updates.isActive !== undefined) {
            fields.push(`is_active = $${paramCount}`);
            values.push(updates.isActive);
            paramCount++;
        }

        if (updates.isEmailVerified !== undefined) {
            fields.push(`is_email_verified = $${paramCount}`);
            values.push(updates.isEmailVerified);
            paramCount++;
        }

        if (updates.lastLoginAt) {
            fields.push(`last_login_at = $${paramCount}`);
            values.push(updates.lastLoginAt);
            paramCount++;
        }

        if (fields.length === 0) {
            return await User.findById(id);
        }

        values.push(id);
        const result = await query(
            `UPDATE users 
             SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${paramCount}
             RETURNING id, username, email, full_name, role, is_active, 
                       is_email_verified, last_login_at, created_at, updated_at`,
            values
        );
        
        return result.rows[0];
    }

    static async updateLastLogin(id) {
        await query(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );
    }

    static async verifyPassword(user, password) {
        return await bcrypt.compare(password, user.password_hash);
    }

    static async createSession(userId, token, refreshToken, userAgent, ip) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const result = await query(
            `INSERT INTO sessions (user_id, session_token, refresh_token, user_agent, ip_address, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, token, refreshToken, userAgent, ip, expiresAt]
        );
        
        return result.rows[0];
    }

    static async revokeSession(sessionToken) {
        await query(
            'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_token = $1',
            [sessionToken]
        );
    }

    static async getSessions(userId) {
        const result = await query(
            `SELECT * FROM sessions 
             WHERE user_id = $1 AND revoked_at IS NULL 
             ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async logActivity(userId, actionType, details, ip, userAgent) {
        await query(
            `INSERT INTO user_activity_logs (user_id, action_type, action_details, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, actionType, details, ip, userAgent]
        );
    }
}

module.exports = User;