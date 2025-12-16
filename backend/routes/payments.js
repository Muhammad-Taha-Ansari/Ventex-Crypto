const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import payment controller
let paymentController;
try {
  paymentController = require('../controllers/paymentController');
} catch (error) {
  console.error('Error loading payment controller:', error);
  // Create a dummy controller if loading fails
  paymentController = {
    createPaymentIntent: (req, res) => res.status(500).json({ success: false, message: 'Payment controller not available' }),
    confirmPayment: (req, res) => res.status(500).json({ success: false, message: 'Payment controller not available' }),
    getPaymentStatus: (req, res) => res.status(500).json({ success: false, message: 'Payment controller not available' }),
  };
}

// All routes require authentication
router.post('/create-payment-intent', protect, paymentController.createPaymentIntent);
router.post('/confirm-payment', protect, paymentController.confirmPayment);
router.get('/payment-status', protect, paymentController.getPaymentStatus);

// Test route to verify payments route is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Payments route is working' });
});

// Note: Webhook route is handled in app.js before body parsing middleware

module.exports = router;
