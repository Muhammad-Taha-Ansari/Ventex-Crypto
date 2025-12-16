const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.get('/:id', transactionController.getTransaction);

module.exports = router;

