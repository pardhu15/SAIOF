const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verifies JWT in Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_saiof_token_key_development_only_9988');

      // Get user from database (select excluding password) or fallback offline
      let user;
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log(`[Auth Middleware Fallback] Database offline. Returning mock profile for ID: ${decoded.id}`);
        if (decoded.id === "60d5ecb7b4cd9c00155b4d7c") {
          user = {
            _id: "60d5ecb7b4cd9c00155b4d7c",
            name: "SAIOF Admin",
            email: "admin@saiof.com",
            role: "admin"
          };
        } else {
          user = {
            _id: decoded.id,
            name: "SAIOF User",
            email: "user@saiof.com",
            role: "user"
          };
        }
      } else {
        user = await User.findById(decoded.id).select('-password');
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Attach user object to request
      req.user = user;
      return next();
    } catch (error) {
      console.error(`[Auth Middleware] JWT Validation failed: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

/**
 * Admin check - verifies user has the admin role
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Developer/Admin role required'
    });
  }
};

module.exports = {
  protect,
  admin
};
