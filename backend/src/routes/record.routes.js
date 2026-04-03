const express = require('express');
const router = express.Router();
const recordService = require('../services/record.service');
const { authenticate, authenticateFreshUser } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createRecordSchema, updateRecordSchema, listRecordsSchema } = require('../validators/record.validator');
const { idParamSchema } = require('../validators/common.validator');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial records management
 */

/**
 * @swagger
 * /api/v1/records:
 *   post:
 *     summary: Create a financial record (admin only)
 *     tags: [Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1500.00
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 example: Salary
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *               description:
 *                 type: string
 *                 example: Monthly salary payment
 *     responses:
 *       201:
 *         description: Record created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticateFreshUser,
  authorize('records', 'create'),
  validate(createRecordSchema, 'body'),
  async (req, res, next) => {
    try {
      const record = await recordService.createRecord(req.body, req.user.id);
      ApiResponse.created(res, 'Record created successfully', record);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/records:
 *   get:
 *     summary: List financial records (analyst/admin only)
 *     tags: [Records]
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
 *         name: state
 *         schema:
 *           type: string
 *           enum: [active, deleted, all]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of records
 */
router.get(
  '/',
  authenticate,
  authorize('records', 'read'),
  validate(listRecordsSchema, 'query'),
  async (req, res, next) => {
    try {
      const { records, total, page, limit, totalPages } = await recordService.getAllRecords(
        req.query,
        req.user
      );
      ApiResponse.ok(res, 'Records retrieved successfully', records, { page, limit, total, totalPages });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/records/{id}:
 *   get:
 *     summary: Get a single financial record
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         description: Record not found
 */
router.get(
  '/:id',
  authenticate,
  authorize('records', 'read'),
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const record = await recordService.getRecordById(req.params.id);
      ApiResponse.ok(res, 'Record retrieved successfully', record);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/records/{id}:
 *   put:
 *     summary: Update a financial record (admin only)
 *     tags: [Records]
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
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 */
router.put(
  '/:id',
  authenticateFreshUser,
  authorize('records', 'update'),
  validate(idParamSchema, 'params'),
  validate(updateRecordSchema, 'body'),
  async (req, res, next) => {
    try {
      const record = await recordService.updateRecord(req.params.id, req.body, req.user.id);
      ApiResponse.ok(res, 'Record updated successfully', record);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/records/{id}:
 *   delete:
 *     summary: Soft-delete a financial record (admin only)
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record deleted
 */
router.delete(
  '/:id',
  authenticateFreshUser,
  authorize('records', 'delete'),
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      await recordService.deleteRecord(req.params.id, req.user.id);
      ApiResponse.ok(res, 'Record deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/records/{id}/recover:
 *   patch:
 *     summary: Restore a soft-deleted financial record (admin only)
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record restored
 */
router.patch(
  '/:id/recover',
  authenticateFreshUser,
  authorize('records', 'delete'),
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const record = await recordService.recoverRecord(req.params.id, req.user.id);
      ApiResponse.ok(res, 'Record restored successfully', record);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
