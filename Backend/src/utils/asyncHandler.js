// src/utils/asyncHandler.js
'use strict';

/**
 * Wraps an async Express handler so that any rejected promise
 * is forwarded to next(err) automatically.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
