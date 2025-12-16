const express = require('express');
const router = express.Router();

/* GET API info. */
router.get('/', function(req, res, next) {
  res.json({
    message: 'Crypto App API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      portfolio: '/api/portfolio',
      transactions: '/api/transactions',
      health: '/api/health',
    },
  });
});

module.exports = router;
