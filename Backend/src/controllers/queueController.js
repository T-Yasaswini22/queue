// src/controllers/queueController.js
'use strict';

const queueService = require('../services/queueService');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getQueue = asyncHandler(async (req, res) => {
  const result = await queueService.getQueueForService(
    req.params.serviceId,
    req.query.date
  );
  ApiResponse.ok(res, 'Queue retrieved.', result);
});

const getToken = asyncHandler(async (req, res) => {
  const token = await queueService.getTokenById(req.params.tokenId);
  ApiResponse.ok(res, 'Token retrieved.', { token });
});

const callNext = asyncHandler(async (req, res) => {
  const token = await queueService.callNextToken(
    req.params.serviceId,
    req.user.id
  );
  ApiResponse.ok(res, 'Next token called.', { token });
});

const skipToken = asyncHandler(async (req, res) => {
  const token = await queueService.skipToken(req.params.tokenId, req.user.id);
  ApiResponse.ok(res, 'Token skipped.', { token });
});

const completeToken = asyncHandler(async (req, res) => {
  const token = await queueService.completeToken(req.params.tokenId, req.user.id);
  ApiResponse.ok(res, 'Token completed.', { token });
});

const startService = asyncHandler(async (req, res) => {
  const token = await queueService.startService(req.params.tokenId, req.user.id);
  ApiResponse.ok(res, 'Service started for token.', { token });
});

module.exports = { getQueue, getToken, callNext, skipToken, completeToken, startService };
