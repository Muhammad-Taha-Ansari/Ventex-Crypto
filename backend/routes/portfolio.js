const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', portfolioController.getPortfolio);
router.get('/summary', portfolioController.getPortfolioSummary);

module.exports = router;

