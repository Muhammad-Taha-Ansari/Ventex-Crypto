// Simple rate limiter (in production, use express-rate-limit with Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

exports.apiLimiter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitStore.has(clientIP)) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const limitData = rateLimitStore.get(clientIP);

  if (now > limitData.resetTime) {
    limitData.count = 1;
    limitData.resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(clientIP, limitData);
    return next();
  }

  if (limitData.count >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  }

  limitData.count += 1;
  rateLimitStore.set(clientIP, limitData);
  next();
};

