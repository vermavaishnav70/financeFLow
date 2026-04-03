const crypto = require('crypto');

/**
 * Request ID middleware.
 * Assigns a unique ID to each request for log correlation.
 * Uses X-Request-ID header if provided, otherwise generates a UUID.
 */
const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

module.exports = { requestId };
