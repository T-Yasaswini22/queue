// src/routes/staff.routes.js
'use strict';

const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/staffController');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const { body }     = require('express-validator');
const validate     = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff assignment and schedule management
 */

// ── Staff self-service ─────────────────────────────────────────────────────

/** @swagger
 * /api/staff/my-services:
 *   get:
 *     tags: [Staff]
 *     summary: Get services assigned to the logged-in staff member
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/my-services',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  controller.getMyServices
);

router.get(
  '/my-schedules',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  controller.getMySchedules
);

router.post(
  '/schedules',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  [
    body('serviceId').isUUID().withMessage('serviceId must be a valid UUID.'),
    body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be 0–6.'),
    body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('startTime must be HH:MM.'),
    body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('endTime must be HH:MM.'),
  ],
  validate,
  controller.createSchedule
);

router.delete(
  '/schedules/:id',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  controller.deleteSchedule
);

// ── Admin assignment management ─────────────────────────────────────────────

router.post(
  '/assign',
  authenticate,
  authorize('ADMIN'),
  [
    body('staffId').isUUID().withMessage('staffId must be a valid UUID.'),
    body('serviceId').isUUID().withMessage('serviceId must be a valid UUID.'),
  ],
  validate,
  controller.assignStaff
);

router.delete(
  '/unassign',
  authenticate,
  authorize('ADMIN'),
  [
    body('staffId').isUUID().withMessage('staffId must be a valid UUID.'),
    body('serviceId').isUUID().withMessage('serviceId must be a valid UUID.'),
  ],
  validate,
  controller.unassignStaff
);

module.exports = router;
