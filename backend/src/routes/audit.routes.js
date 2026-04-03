const express = require('express');
const router = express.Router();
const auditService = require('../services/audit.service');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { listAuditLogsSchema } = require('../validators/audit.validator');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit log access for admins
 */

/**
 * @swagger
 * /api/v1/audit:
 *   get:
 *     summary: List audit logs (admin only)
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [user, record]
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
router.get(
  '/',
  authenticate,
  authorize('users', 'read'),
  validate(listAuditLogsSchema, 'query'),
  async (req, res, next) => {
    try {
      const { logs, total, page, limit, totalPages } = await auditService.getAuditLogs(req.query);
      ApiResponse.ok(res, 'Audit logs retrieved successfully', logs, { page, limit, total, totalPages });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
