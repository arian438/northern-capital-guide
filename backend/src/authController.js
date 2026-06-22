const User = require('./models/User');
const { generateToken, generateRefreshToken } = require('./config/auth');
const { logger } = require('./config/database');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        // Проверка существующего пользователя
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь с таким email уже существует'
            });
        }

        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Имя пользователя уже занято'
            });
        }

        // Создание пользователя
        const user = await User.create({
            username,
            email,
            password,
            fullName: fullName || username
        });

        // Генерация токенов
        const token = generateToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        // Сохранение сессии
        const userAgent = req.get('user-agent');
        const ip = req.ip || req.connection.remoteAddress;
        await User.createSession(user.id, token, refreshToken, userAgent, ip);

        // Логирование
        await User.logActivity(user.id, 'register', { method: 'email' }, ip, userAgent);

        res.status(201).json({
            success: true,
            message: 'Регистрация успешна',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role
                },
                token,
                refreshToken
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при регистрации'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Поиск пользователя
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        // Проверка активности
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Аккаунт деактивирован'
            });
        }

        // Проверка пароля
        const isPasswordValid = await User.verifyPassword(user, password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        // Обновление времени последнего входа
        await User.updateLastLogin(user.id);

        // Генерация токенов
        const token = generateToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        // Сохранение сессии
        const userAgent = req.get('user-agent');
        const ip = req.ip || req.connection.remoteAddress;
        await User.createSession(user.id, token, refreshToken, userAgent, ip);

        // Логирование
        await User.logActivity(user.id, 'login', { method: 'email' }, ip, userAgent);

        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    isEmailVerified: user.is_email_verified
                },
                token,
                refreshToken
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при входе'
        });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token обязателен'
            });
        }

        // Проверка refresh token
        const decoded = require('./config/auth').verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Недействительный refresh token'
            });
        }

        // Проверка существования сессии
        const sessionResult = await require('./config/database').query(
            'SELECT * FROM sessions WHERE refresh_token = $1 AND revoked_at IS NULL',
            [refreshToken]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Сессия не найдена или отозвана'
            });
        }

        // Проверка срока действия
        const session = sessionResult.rows[0];
        if (new Date(session.expires_at) < new Date()) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token истек'
            });
        }

        // Получение пользователя
        const user = await User.findById(decoded.id);
        if (!user || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Пользователь не найден или неактивен'
            });
        }

        // Генерация новых токенов
        const newToken = generateToken(user.id, user.role);
        const newRefreshToken = generateRefreshToken(user.id);

        // Обновление сессии
        await require('./config/database').query(
            `UPDATE sessions 
             SET session_token = $1, refresh_token = $2, expires_at = $3
             WHERE refresh_token = $4`,
            [newToken, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), refreshToken]
        );

        res.json({
            success: true,
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        logger.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при обновлении токена'
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            // Отзыв сессии
            await User.revokeSession(token);
            
            // Логирование
            const userAgent = req.get('user-agent');
            const ip = req.ip || req.connection.remoteAddress;
            await User.logActivity(req.user.id, 'logout', {}, ip, userAgent);
        }

        res.json({
            success: true,
            message: 'Выход выполнен успешно'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при выходе'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        res.json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении профиля'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email } = req.body;
        const updates = {};

        if (fullName) updates.fullName = fullName;
        if (email) {
            // Проверка, не занят ли email
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Email уже используется другим пользователем'
                });
            }
            updates.email = email;
        }

        const user = await User.update(req.user.id, updates);
        
        // Логирование
        const userAgent = req.get('user-agent');
        const ip = req.ip || req.connection.remoteAddress;
        await User.logActivity(req.user.id, 'update_profile', { updates }, ip, userAgent);

        res.json({
            success: true,
            message: 'Профиль обновлен',
            data: { user }
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при обновлении профиля'
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        const isPasswordValid = await User.verifyPassword(user, currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Неверный текущий пароль'
            });
        }

        await User.update(req.user.id, { password: newPassword });

        // Логирование
        const userAgent = req.get('user-agent');
        const ip = req.ip || req.connection.remoteAddress;
        await User.logActivity(req.user.id, 'change_password', {}, ip, userAgent);

        res.json({
            success: true,
            message: 'Пароль успешно изменен'
        });
    } catch (error) {
        logger.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при изменении пароля'
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findByEmail(email);
        if (!user) {
            // Не раскрываем информацию о существовании пользователя
            return res.json({
                success: true,
                message: 'Если пользователь с таким email существует, инструкции по сбросу пароля будут отправлены'
            });
        }

        // Генерация токена
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 час

        await require('./config/database').query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO UPDATE 
             SET token = $2, expires_at = $3, used_at = NULL`,
            [user.id, token, expiresAt]
        );

        // TODO: Отправить email с ссылкой для сброса
        // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        
        // Логирование
        const userAgent = req.get('user-agent');
        const ip = req.ip || req.connection.remoteAddress;
        await User.logActivity(user.id, 'forgot_password', { email }, ip, userAgent);

        res.json({
            success: true,
            message: 'Инструкции по сбросу пароля отправлены на вашу почту'
        });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при отправке инструкций'
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const result = await require('./config/database').query(
            `SELECT * FROM password_reset_tokens 
             WHERE token = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Недействительный или истекший токен'
            });
        }

        const resetToken = result.rows[0];

        // Обновление пароля
        await User.update(resetToken.user_id, { password: newPassword });

        // Отметка токена как использованного
        await require('./config/database').query(
            'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
            [resetToken.id]
        );

        // Логирование
        const userAgent = req.get('user-agent');
        const ip = req.ip || req.connection.remoteAddress;
        await User.logActivity(resetToken.user_id, 'reset_password', {}, ip, userAgent);

        res.json({
            success: true,
            message: 'Пароль успешно сброшен'
        });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при сбросе пароля'
        });
    }
};