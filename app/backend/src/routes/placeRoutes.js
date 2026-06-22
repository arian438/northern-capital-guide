const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate, placeValidation, reviewValidation } = require('../middleware/validation');

// Публичные маршруты
router.get('/', placeController.getPlaces);
router.get('/nearby', placeController.getNearbyPlaces);
router.get('/:id', placeController.getPlaceById);
router.get('/:id/reviews', placeController.getReviews);

// Защищенные маршруты
router.post('/:id/reviews', authMiddleware, validate(reviewValidation.create), placeController.addReview);

// Маршруты администратора
router.post('/', authMiddleware, adminMiddleware, validate(placeValidation.create), placeController.createPlace);
router.put('/:id', authMiddleware, adminMiddleware, validate(placeValidation.update), placeController.updatePlace);
router.delete('/:id', authMiddleware, adminMiddleware, placeController.deletePlace);

module.exports = router;