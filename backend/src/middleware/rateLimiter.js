const rateLimit = require('express-rate-limit');

/**
 * General rate limiter: 1000 requests per 15 minutes per IP.
 * Lenient for development/testing while still providing protection.
 */
const generalLimiter = (process.env.NODE_ENV !== 'development') ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests, please try again later',
  },
}) : (req, res, next) => next();

/**
 * Stricter rate limiter for auth endpoints: 50 requests per 15 minutes.
 * Prevents brute-force attacks on login/register while allowing testing.
 */
const authLimiter = (process.env.NODE_ENV !== 'development') ? rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts, please try again later',
  },
}) : (req, res, next) => next();

module.exports = { generalLimiter, authLimiter };
