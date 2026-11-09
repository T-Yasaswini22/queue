// src/controllers/feedbackController.js
'use strict';

const feedbackService = require('../services/feedbackService');
const ApiResponse     = require('../utils/ApiResponse');
const asyncHandler    = require('../utils/asyncHandler');

const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.submitFeedback(req.user.id, req.body);
  ApiResponse.created(res, 'Feedback submitted.', { feedback });
});

const getMyFeedback = asyncHandler(async (req, res) => {
  const result = await feedbackService.getMyFeedback(req.user.id, req.query);
  ApiResponse.ok(res, 'Feedback retrieved.', result.feedback, result.meta);
});

const getAllFeedback = asyncHandler(async (req, res) => {
  const result = await feedbackService.getAllFeedback(req.query);
  ApiResponse.ok(res, 'All feedback retrieved.', result.feedback, result.meta);
});

const getServiceRatings = asyncHandler(async (req, res) => {
  const ratings = await feedbackService.getServiceRatings(req.params.serviceId);
  ApiResponse.ok(res, 'Service ratings retrieved.', { ratings });
});

module.exports = { submitFeedback, getMyFeedback, getAllFeedback, getServiceRatings };
