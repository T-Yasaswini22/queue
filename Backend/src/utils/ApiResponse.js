// src/utils/ApiResponse.js
'use strict';

/**
 * Standard API response envelope.
 */
class ApiResponse {
  /**
   * @param {object} res        - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message    - Success message
   * @param {*}      data       - Response payload
   * @param {object} [meta]     - Optional pagination / extra metadata
   */
  static success(res, statusCode, message, data = null, meta = null) {
    const body = { success: true, message };
    if (data !== null) body.data = data;
    if (meta !== null) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static ok(res, message, data, meta) {
    return ApiResponse.success(res, 200, message, data, meta);
  }

  static created(res, message, data) {
    return ApiResponse.success(res, 201, message, data);
  }
}

module.exports = ApiResponse;
