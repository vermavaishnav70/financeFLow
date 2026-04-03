const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboard.service');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { trendsQuerySchema, recentQuerySchema, categoriesQuerySchema } = require('../validators/dashboard.validator');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics and summary endpoints
 */

/**
 * @swagger
 * /api/v1/dashboard/overview:
 *   get:
 *     summary: Get financial overview (analyst, admin)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Financial overview with totals
 */
router.get(
  '/overview',
  authenticate,
  authorize('dashboard', 'overview'),
  async (req, res, next) => {
    try {
      const overview = await dashboardService.getOverview();
      ApiResponse.ok(res, 'Dashboard overview retrieved', overview);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/dashboard/insights:
 *   get:
 *     summary: Get high-level financial insights (viewer, analyst, admin)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard insight cards and high-signal metrics
 */
router.get(
  '/insights',
  authenticate,
  authorize('dashboard', 'insights'),
  async (req, res, next) => {
    try {
      const insights = await dashboardService.getInsights();
      ApiResponse.ok(res, 'Dashboard insights retrieved', insights);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/dashboard/categories:
 *   get:
 *     summary: Get category-wise breakdown (analyst, admin)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *         description: Filter by record type
 *     responses:
 *       200:
 *         description: Category breakdown with percentages
 */
router.get(
  '/categories',
  authenticate,
  authorize('dashboard', 'categories'),
  validate(categoriesQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const breakdown = await dashboardService.getCategoryBreakdown(req.query.type);
      ApiResponse.ok(res, 'Category breakdown retrieved', breakdown);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/dashboard/trends:
 *   get:
 *     summary: Get monthly income/expense trends (analyst, admin)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of months to look back
 *     responses:
 *       200:
 *         description: Monthly trends data
 */
router.get(
  '/trends',
  authenticate,
  authorize('dashboard', 'trends'),
  validate(trendsQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const trends = await dashboardService.getMonthlyTrends(req.query.months);
      ApiResponse.ok(res, 'Monthly trends retrieved', trends);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/dashboard/recent:
 *   get:
 *     summary: Get recent activity (all roles)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent records
 *     responses:
 *       200:
 *         description: Recent activity list
 */
router.get(
  '/recent',
  authenticate,
  authorize('dashboard', 'recent'),
  validate(recentQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const recent = await dashboardService.getRecentActivity(req.query.limit);
      ApiResponse.ok(res, 'Recent activity retrieved', recent);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/dashboard/comparison:
 *   get:
 *     summary: Current month vs previous month comparison (analyst, admin)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Period comparison with percent change
 */
router.get(
  '/comparison',
  authenticate,
  authorize('dashboard', 'comparison'),
  async (req, res, next) => {
    try {
      const comparison = await dashboardService.getComparison();
      ApiResponse.ok(res, 'Period comparison retrieved', comparison);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
