const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const transactionRoutes = require('./routes/transactions');
const paymentRoutes = require('./routes/payments');

// Import error handler
const errorHandler = require('./middleware/errorHandler');
const { securityHeaders } = require('./middleware/security');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// Stripe webhook route (must be before body parsing)
app.post('/api/payments/webhook', bodyParser.raw({ type: 'application/json' }), (req, res, next) => {
  const paymentController = require('./controllers/paymentController');
  paymentController.handleWebhook(req, res);
});

// Middleware
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);

// Debug: Log all registered routes
if (process.env.NODE_ENV === 'development') {
  console.log('Registered payment routes:');
  paymentRoutes.stack.forEach((r) => {
    if (r.route) {
      console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
    }
  });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
