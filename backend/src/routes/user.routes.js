const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const { authenticate, authenticateFreshUser } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createUserSchema, updateUserSchema, updateStatusSchema, updatePasswordSchema, listUsersSchema } = require('../validators/user.validator');
const { idParamSchema } = require('../validators/common.validator');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (admin only, except /me)
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Current user profile
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = userService.getMe(req.user);
    ApiResponse.ok(res, 'User profile retrieved', user);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/me/password:
 *   patch:
 *     summary: Update current user's password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Current password incorrect
 */
router.patch(
  '/me/password',
  authenticateFreshUser,
  validate(updatePasswordSchema, 'body'),
  async (req, res, next) => {
    try {
      const result = await userService.updatePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      ApiResponse.ok(res, 'Password updated successfully', result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a user (admin only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       201:
 *         description: User created
 */
router.post(
  '/',
  authenticateFreshUser,
  authorize('users', 'create'),
  validate(createUserSchema, 'body'),
  async (req, res, next) => {
    try {
      const user = await userService.createUser(req.body, req.user.id);
      ApiResponse.created(res, 'User created successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [VIEWER, ANALYST, ADMIN]
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  authenticate,
  authorize('users', 'read'),
  validate(listUsersSchema, 'query'),
  async (req, res, next) => {
    try {
      const { users, total, page, limit, totalPages } = await userService.getAllUsers(req.query);
      ApiResponse.ok(res, 'Users retrieved successfully', users, { page, limit, total, totalPages });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  authenticate,
  authorize('users', 'read'),
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.id);
      ApiResponse.ok(res, 'User retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *     responses:
 *       200:
 *         description: User updated
 */
router.put(
  '/:id',
  authenticateFreshUser,
  authorize('users', 'update'),
  validate(idParamSchema, 'params'),
  validate(updateUserSchema, 'body'),
  async (req, res, next) => {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user.id);
      ApiResponse.ok(res, 'User updated successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}/status:
 *   patch:
 *     summary: Update user status (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: User status updated
 */
router.patch(
  '/:id/status',
  authenticateFreshUser,
  authorize('users', 'update'),
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  async (req, res, next) => {
    try {
      const user = await userService.updateUserStatus(req.params.id, req.body.status, req.user.id);
      ApiResponse.ok(res, 'User status updated successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete (deactivate) user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated
 */
router.delete(
  '/:id',
  authenticateFreshUser,
  authorize('users', 'delete'),
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const user = await userService.deleteUser(req.params.id, req.user.id);
      ApiResponse.ok(res, 'User deactivated successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
