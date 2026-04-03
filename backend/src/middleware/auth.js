const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Authentication middleware.
 * Extracts and verifies JWT from Authorization header.
 * Attaches trusted token claims to req.user.
 */
function getTokenClaims(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token is missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (!decoded.id || !decoded.email || !decoded.role || !decoded.name) {
      throw ApiError.unauthorized('Invalid token payload');
    }

    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired');
    }

    if (err.statusCode) {
      throw err;
    }

    throw ApiError.unauthorized('Invalid token');
  }
}

const authenticate = async (req, res, next) => {
  try {
    const decoded = getTokenClaims(req);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

const authenticateFreshUser = async (req, res, next) => {
  try {
    const decoded = getTokenClaims(req);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        name: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    if (user.status === 'INACTIVE') {
      throw ApiError.unauthorized('Account is deactivated');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, authenticateFreshUser };
