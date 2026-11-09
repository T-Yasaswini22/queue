// src/services/serviceService.js
'use strict';

const serviceRepository = require('../repositories/serviceRepository');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');

const getServices = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const isActive = query.active !== undefined ? query.active === 'true' : undefined;

  const { rows, total } = await serviceRepository.findAll({
    search: query.search,
    isActive,
    limit,
    offset,
  });

  return { services: rows, meta: buildMeta(total, page, limit) };
};

const getServiceById = async (id) => {
  const service = await serviceRepository.findById(id);
  if (!service) throw ApiError.notFound('Service not found.');
  const settings = await serviceRepository.getSettings(id);
  return { ...service, settings };
};

const createService = async (data) => {
  const service = await serviceRepository.create(data);
  // Create default queue settings
  await serviceRepository.upsertSettings(service.id, {
    avgServiceDurationMin: data.avgServiceDurationMin || 15,
  });
  return service;
};

const updateService = async (id, data) => {
  const service = await serviceRepository.findById(id);
  if (!service) throw ApiError.notFound('Service not found.');
  return serviceRepository.update(id, data);
};

const deactivateService = async (id) => {
  const service = await serviceRepository.findById(id);
  if (!service) throw ApiError.notFound('Service not found.');
  return serviceRepository.update(id, { is_active: false });
};

const getQueueSettings = async (serviceId) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) throw ApiError.notFound('Service not found.');
  const settings = await serviceRepository.getSettings(serviceId);
  return settings;
};

const updateQueueSettings = async (serviceId, data) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) throw ApiError.notFound('Service not found.');
  return serviceRepository.upsertSettings(serviceId, data);
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deactivateService,
  getQueueSettings,
  updateQueueSettings,
};
