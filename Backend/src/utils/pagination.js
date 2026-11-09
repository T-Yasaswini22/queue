// src/utils/pagination.js
'use strict';

/**
 * Parse pagination query parameters.
 * @param {object} query - Express req.query
 * @returns {{ page, limit, offset }}
 */
const parsePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page, 10)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Build pagination meta for the response envelope.
 */
const buildMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

module.exports = { parsePagination, buildMeta };
