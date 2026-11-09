// src/routes/queue.routes.js
'use strict';

const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/queueController');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');

/**
 * @swagger
 * tags:
 *   name: Queue
 *   description: Queue management and token operations
 */

/**
 * @swagger
 * /api/queue/{serviceId}:
 *   get:
 *     tags: [Queue]
 *     summary: Get the current queue for a service
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         description: Queue date (defaults to today)
 *     responses:
 *       200:
 *         description: Queue with tokens, stats, and wait times
 */
router.get('/:serviceId', authenticate, controller.getQueue);

/**
 * @swagger
 * /api/queue/tokens/{tokenId}:
 *   get:
 *     tags: [Queue]
 *     summary: Get a specific token by ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/tokens/:tokenId', authenticate, controller.getToken);

/**
 * @swagger
 * /api/queue/{serviceId}/call-next:
 *   post:
 *     tags: [Queue]
 *     summary: Call the next waiting token (Staff only)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:serviceId/call-next',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  controller.callNext
);

/**
 * @swagger
 * /api/queue/tokens/{tokenId}/skip:
 *   patch:
 *     tags: [Queue]
 *     summary: Skip a called token (Staff only)
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/tokens/:tokenId/skip',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  controller.skipToken
);

/**
 * @swagger
 * /api/queue/tokens/{tokenId}/start:
 *   patch:
 *     tags: [Queue]
 *     summary: Mark token as IN_SERVICE (Staff only)
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/tokens/:tokenId/start',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  controller.startService
);

/**
 * @swagger
 * /api/queue/tokens/{tokenId}/complete:
 *   patch:
 *     tags: [Queue]
 *     summary: Complete a token (Staff only)
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/tokens/:tokenId/complete',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  controller.completeToken
);

module.exports = router;
