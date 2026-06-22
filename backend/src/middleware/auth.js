const { verifyToken } = require('../config/auth');
const { query } = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Требуется авторизация' 
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ 
                success: false, 
                message: 'Недействительный токен' 
            });
        }

        // Проверяем, существует ли пользователь
        const userResult = await query(
            'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Пользователь не найден' 
            });
        }

        const user = userResult.rows[0];
        
        if (!user.is_active) {
            return res.status(403).json({ 
                success: false, 
                message: 'Аккаунт деактивирован' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Ошибка авторизации' 
        });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Доступ запрещен. Требуются права администратора' 
        });
    }
    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware
};