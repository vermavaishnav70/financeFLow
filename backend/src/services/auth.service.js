const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Auth Service — Registration and Login business logic.
 */

const SALT_ROUNDS = 12;
const userSessionSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
};

/**
 * Register a new user.
 * @param {object} data - { name, email, password }
 * @returns {Promise<{ user, token }>}
 */
async function register({ name, email, password }) {
  // Service-level guard: check for existing user before hitting DB constraint
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'VIEWER', // Default to least privilege
    },
    select: userSessionSelect,
  });

  const token = generateToken(user);

  return { user, token };
}

/**
 * Login with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user, token }>}
 */
async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.status === 'INACTIVE') {
    throw ApiError.unauthorized('Account is deactivated. Contact an administrator.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken(user);

  const { passwordHash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

/**
 * Generate a JWT for a user.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }
  );
}

module.exports = { register, login };
