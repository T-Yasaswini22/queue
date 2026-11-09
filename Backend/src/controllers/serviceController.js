// src/controllers/serviceController.js
'use strict';

const serviceService = require('../services/serviceService');
const ApiResponse    = require('../utils/ApiResponse');
const asyncHandler   = require('../utils/asyncHandler');

const getServices = asyncHandler(async (req, res) => {
  const result = await serviceService.getServices(req.query);
  ApiResponse.ok(res, 'Services retrieved.', result.services, result.meta);
});

const getServiceById = asyncHandler(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.id);
  ApiResponse.ok(res, 'Service retrieved.', { service });
});

const createService = asyncHandler(async (req, res) => {
  const { name, description, location, avgServiceDurationMin, maxCapacity } = req.body;
  const service = await serviceService.createService({
    name, description, location, avgServiceDurationMin, maxCapacity,
  });
  ApiResponse.created(res, 'Service created.', { service });
});

const updateService = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body);
  ApiResponse.ok(res, 'Service updated.', { service });
});

const deactivateService = asyncHandler(async (req, res) => {
  const service = await serviceService.deactivateService(req.params.id);
  ApiResponse.ok(res, 'Service deactivated.', { service });
});

const getQueueSettings = asyncHandler(async (req, res) => {
  const settings = await serviceService.getQueueSettings(req.params.id);
  ApiResponse.ok(res, 'Queue settings retrieved.', { settings });
});

const updateQueueSettings = asyncHandler(async (req, res) => {
  const settings = await serviceService.updateQueueSettings(req.params.id, req.body);
  ApiResponse.ok(res, 'Queue settings updated.', { settings });
});

module.exports = {
  getServices, getServiceById, createService, updateService,
  deactivateService, getQueueSettings, updateQueueSettings,
};
