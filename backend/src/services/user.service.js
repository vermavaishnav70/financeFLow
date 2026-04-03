const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const auditService = require('./audit.service');
const bcrypt = require('bcryptjs');

/**
 * User Service — User management business logic.
 */
const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const SALT_ROUNDS = 12;

function getMe(authenticatedUser) {
  return {
    id: authenticatedUser.id,
    name: authenticatedUser.name,
    email: authenticatedUser.email,
    role: authenticatedUser.role,
  };
}

/**
 * Create a new user (admin only).
 * @param {object} data - { name, email, password, role, status }
 * @param {string} performedBy - Admin user ID
 * @returns {Promise<object>}
 */
async function createUser({ name, email, password, role = 'VIEWER', status = 'ACTIVE' }, performedBy) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        status,
      },
      select: userListSelect,
    });

    await auditService.logAction(tx, {
      action: 'CREATE',
      entity: 'user',
      entityId: user.id,
      performedBy,
      after: {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    return user;
  });

  return createdUser;
}

/**
 * Get all users (paginated, filterable).
 * @param {object} filters - { page, limit, status, role }
 * @returns {Promise<{ users, total, page, limit, totalPages }>}
 */
async function getAllUsers({ page = 1, limit = 20, status, role }) {
  const where = {};
  if (status) where.status = status;
  if (role) where.role = role;

  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: userListSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single user by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userListSelect,
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
}

/**
 * Update a user's profile (admin only).
 * @param {string} id - User ID to update
 * @param {object} data - { name?, email?, role? }
 * @param {string} performedBy - Admin user ID
 * @returns {Promise<object>}
 */
async function updateUser(id, data, performedBy) {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw ApiError.notFound('User not found');
  }

  // If email is being changed, check for duplicates
  if (data.email && data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      throw ApiError.conflict('A user with this email already exists');
    }
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data,
      select: userListSelect,
    });

    await auditService.logAction(tx, {
      action: 'UPDATE',
      entity: 'user',
      entityId: id,
      performedBy,
      before: { name: existingUser.name, email: existingUser.email, role: existingUser.role },
      after: { name: user.name, email: user.email, role: user.role },
    });

    return user;
  });

  return updatedUser;
}

/**
 * Update a user's status (activate/deactivate).
 * @param {string} id
 * @param {string} status - ACTIVE | INACTIVE
 * @param {string} performedBy - Admin user ID
 * @returns {Promise<object>}
 */
async function updateUserStatus(id, status, performedBy) {
  // Service-level guard: prevent self-deactivation
  if (id === performedBy && status === 'INACTIVE') {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw ApiError.notFound('User not found');
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: { status },
      select: userListSelect,
    });

    await auditService.logAction(tx, {
      action: 'UPDATE',
      entity: 'user',
      entityId: id,
      performedBy,
      before: { status: existingUser.status },
      after: { status: user.status },
    });

    return user;
  });

  return updatedUser;
}

/**
 * Delete (deactivate) a user.
 * @param {string} id
 * @param {string} performedBy
 * @returns {Promise<object>}
 */
async function deleteUser(id, performedBy) {
  // Service-level guard: prevent self-deletion
  if (id === performedBy) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  return updateUserStatus(id, 'INACTIVE', performedBy);
}

/**
 * Update a user's password.
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @returns {Promise<object>}
 */
async function updatePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return { message: 'Password updated successfully' };
}

module.exports = {
  createUser,
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  updatePassword,
  deleteUser,
};
