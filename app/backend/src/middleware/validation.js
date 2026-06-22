const { body, validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    };
};

const authValidation = {
    register: [
        body('username')
            .isLength({ min: 3, max: 50 })
            .withMessage('Имя пользователя должно быть от 3 до 50 символов')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Имя пользователя может содержать только буквы, цифры и подчеркивание'),
        body('email')
            .isEmail()
            .withMessage('Введите корректный email')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Пароль должен быть не менее 6 символов')
            .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
            .withMessage('Пароль должен содержать буквы и цифры'),
        body('fullName')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Имя не должно превышать 100 символов')
    ],
    login: [
        body('email')
            .isEmail()
            .withMessage('Введите корректный email')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Введите пароль')
    ],
    changePassword: [
        body('currentPassword')
            .notEmpty()
            .withMessage('Введите текущий пароль'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('Новый пароль должен быть не менее 6 символов')
            .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
            .withMessage('Пароль должен содержать буквы и цифры')
    ],
    resetPassword: [
        body('email')
            .isEmail()
            .withMessage('Введите корректный email')
            .normalizeEmail()
    ],
    resetPasswordConfirm: [
        body('token')
            .notEmpty()
            .withMessage('Токен обязателен'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('Новый пароль должен быть не менее 6 символов')
            .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
            .withMessage('Пароль должен содержать буквы и цифры')
    ]
};

const placeValidation = {
    create: [
        body('name')
            .isLength({ min: 2, max: 255 })
            .withMessage('Название должно быть от 2 до 255 символов'),
        body('category')
            .isIn(['museum', 'attraction', 'park', 'monument'])
            .withMessage('Некорректная категория'),
        body('shortDesc')
            .isLength({ max: 500 })
            .withMessage('Краткое описание не должно превышать 500 символов'),
        body('fullDesc')
            .isLength({ max: 2000 })
            .withMessage('Полное описание не должно превышать 2000 символов'),
        body('address')
            .isLength({ max: 255 })
            .withMessage('Адрес не должен превышать 255 символов'),
        body('metro')
            .isLength({ max: 100 })
            .withMessage('Метро не должно превышать 100 символов'),
        body('hours')
            .isLength({ max: 100 })
            .withMessage('Часы работы не должны превышать 100 символов'),
        body('lat')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Некорректная широта'),
        body('lng')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Некорректная долгота'),
        body('photoUrl')
            .isURL()
            .withMessage('Введите корректный URL фотографии')
    ],
    update: [
        body('name')
            .optional()
            .isLength({ min: 2, max: 255 })
            .withMessage('Название должно быть от 2 до 255 символов'),
        body('category')
            .optional()
            .isIn(['museum', 'attraction', 'park', 'monument'])
            .withMessage('Некорректная категория'),
        body('shortDesc')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Краткое описание не должно превышать 500 символов'),
        body('fullDesc')
            .optional()
            .isLength({ max: 2000 })
            .withMessage('Полное описание не должно превышать 2000 символов'),
        body('lat')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Некорректная широта'),
        body('lng')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Некорректная долгота')
    ]
};

const reviewValidation = {
    create: [
        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Рейтинг должен быть от 1 до 5'),
        body('comment')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Комментарий не должен превышать 1000 символов')
    ]
};

module.exports = {
    validate,
    authValidation,
    placeValidation,
    reviewValidation
};