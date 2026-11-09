// src/routes/feedback.routes.js
'use strict';

const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/feedbackController');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const validate     = require('../middleware/validate');
const { feedbackValidator } = require('../middleware/validators/feedbackValidators');

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Customer feedback and ratings
 */

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     tags: [Feedback]
 *     summary: Submit feedback for a completed appointment
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, feedbackValidator, validate, controller.submitFeedback);

/**
 * @swagger
 * /api/feedback/my:
 *   get:
 *     tags: [Feedback]
 *     summary: Get feedback submitted by the current user
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', authenticate, controller.getMyFeedback);

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     tags: [Feedback]
 *     summary: Get all feedback (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, authorize('ADMIN'), controller.getAllFeedback);

module.exports = router;
