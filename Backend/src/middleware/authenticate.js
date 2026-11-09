// src/middleware/authenticate.js
'use strict';

const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/userRepository');

/**
 * Middleware: verify JWT and attach req.user.
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided.');
    }
    const token   = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists.');
    }
    if (!user.is_active) {
      throw ApiError.unauthorized('Account deactivated. Contact support.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
