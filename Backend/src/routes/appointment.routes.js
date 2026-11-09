// src/routes/appointment.routes.js
'use strict';

const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/appointmentController');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const validate     = require('../middleware/validate');
const {
  createAppointmentValidator,
  rescheduleValidator,
} = require('../middleware/validators/appointmentValidators');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment booking and management
 */

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Book a new appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId]
 *             properties:
 *               serviceId:   { type: string, format: uuid }
 *               type:        { type: string, enum: [SCHEDULED, WALK_IN] }
 *               scheduledAt: { type: string, format: date-time }
 *               notes:       { type: string }
 *               isPriority:  { type: boolean }
 *     responses:
 *       201:
 *         description: Appointment created with token
 *       409:
 *         description: Time slot conflict
 */
router.post(
  '/',
  authenticate,
  createAppointmentValidator,
  validate,
  controller.createAppointment
);

/**
 * @swagger
 * /api/appointments/my:
 *   get:
 *     tags: [Appointments]
 *     summary: Get logged-in user's appointments
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', authenticate, controller.getMyAppointments);

/**
 * @swagger
 * /api/appointments/admin:
 *   get:
 *     tags: [Appointments]
 *     summary: List all appointments (Admin)
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/admin',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  controller.getAllAppointments
);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     tags: [Appointments]
 *     summary: Get appointment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
router.get('/:id', authenticate, controller.getAppointmentById);

/**
 * @swagger
 * /api/appointments/{id}/reschedule:
 *   patch:
 *     tags: [Appointments]
 *     summary: Reschedule an appointment
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/reschedule',
  authenticate,
  rescheduleValidator,
  validate,
  controller.rescheduleAppointment
);

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   patch:
 *     tags: [Appointments]
 *     summary: Cancel an appointment
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/cancel', authenticate, controller.cancelAppointment);

module.exports = router;
