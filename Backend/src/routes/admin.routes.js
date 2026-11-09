// src/routes/admin.routes.js
'use strict';

const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrator endpoints
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard statistics
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', controller.getDashboardStats);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: Generate appointment reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: serviceId
 *         schema: { type: string, format: uuid }
 */
router.get('/reports', controller.getReports);

// ── User management ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users with filtering and pagination
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUserById);
router.put('/users/:id', controller.updateUser);
router.patch('/users/:id/deactivate', controller.deactivateUser);

module.exports = router;
