// src/middleware/validators/feedbackValidators.js
'use strict';

const { body } = require('express-validator');

const feedbackValidator = [
  body('rating')
    .notEmpty().withMessage('Rating is required.')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
  body('appointmentId')
    .optional().isUUID().withMessage('appointmentId must be a valid UUID.'),
  body('serviceId')
    .optional().isUUID().withMessage('serviceId must be a valid UUID.'),
  body('comment')
    .optional().trim().isLength({ max: 1000 }).withMessage('Comment must be at most 1000 characters.'),
];

module.exports = { feedbackValidator };
