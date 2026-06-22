const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validate, authValidation } = require('../middleware/validation');

// Публичные маршруты
router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(authValidation.resetPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPasswordConfirm), authController.resetPassword);

// Защищенные маршруты
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/change-password', authMiddleware, validate(authValidation.changePassword), authController.changePassword);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;