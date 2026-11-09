// src/routes/service.routes.js
'use strict';

const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/serviceController');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const validate     = require('../middleware/validate');
const {
  createServiceValidator,
  updateServiceValidator,
  queueSettingsValidator,
} = require('../middleware/validators/serviceValidators');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Service management
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     tags: [Services]
 *     summary: List all active services
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of services
 */
router.get('/', controller.getServices);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Get a service by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Service details
 *       404:
 *         description: Service not found
 */
router.get('/:id', controller.getServiceById);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  createServiceValidator,
  validate,
  controller.createService
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  updateServiceValidator,
  validate,
  controller.updateService
);

router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('ADMIN'),
  controller.deactivateService
);

router.get(
  '/:id/queue-settings',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  controller.getQueueSettings
);

router.put(
  '/:id/queue-settings',
  authenticate,
  authorize('ADMIN'),
  queueSettingsValidator,
  validate,
  controller.updateQueueSettings
);

// Feedback ratings for a service (public)
router.get(
  '/:serviceId/ratings',
  require('../controllers/feedbackController').getServiceRatings
);

// Staff for a service (admin only)
router.get(
  '/:serviceId/staff',
  authenticate,
  authorize('ADMIN'),
  require('../controllers/staffController').getServiceStaff
);

module.exports = router;
