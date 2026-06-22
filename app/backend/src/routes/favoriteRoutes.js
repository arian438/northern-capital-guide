const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', favoriteController.getFavorites);
router.post('/:placeId', favoriteController.addFavorite);
router.delete('/:placeId', favoriteController.removeFavorite);
router.get('/:placeId/check', favoriteController.checkFavorite);

module.exports = router;