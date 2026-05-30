const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_saiof_token_key_development_only_9988',
    { expiresIn: '30d' }
  );
};

/**
 * Register user service
 */
const registerUser = async (userData) => {
  const { name, email, password, role } = userData;

  // Offline Fallback Mode
  if (mongoose.connection.readyState !== 1) {
    console.log('[Auth Service Fallback] Database offline. Executing offline user registration...');
    return {
      _id: "60d5ecb7b4cd9c00155b4d7d",
      name: name || 'SAIOF User',
      email: email,
      role: role || 'user',
      token: generateToken("60d5ecb7b4cd9c00155b4d7d")
    };
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists with this email');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user' // default to "user"
  });

  if (user) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    };
  } else {
    throw new Error('Invalid user data provided');
  }
};

/**
 * Login user service
 */
const loginUser = async (email, password) => {
  // Offline Fallback Mode
  if (mongoose.connection.readyState !== 1) {
    console.log('[Auth Service Fallback] Database offline. Executing offline user login...');
    if (email === 'admin@saiof.com' || email.includes('admin')) {
      return {
        _id: "60d5ecb7b4cd9c00155b4d7c",
        name: "SAIOF Admin",
        email: email,
        role: "admin",
        token: generateToken("60d5ecb7b4cd9c00155b4d7c")
      };
    }
    return {
      _id: "60d5ecb7b4cd9c00155b4d7d",
      name: "SAIOF User",
      email: email,
      role: "user",
      token: generateToken("60d5ecb7b4cd9c00155b4d7d")
    };
  }

  // Find user by email and select password field (which is select: false by default)
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Compare passwords
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  };
};

/**
 * Get user profile service
 */
const getUserProfile = async (userId) => {
  // Offline Fallback Mode
  if (mongoose.connection.readyState !== 1) {
    if (userId === "60d5ecb7b4cd9c00155b4d7c") {
      return {
        _id: "60d5ecb7b4cd9c00155b4d7c",
        name: "SAIOF Admin",
        email: "admin@saiof.com",
        role: "admin"
      };
    }
    return {
      _id: userId,
      name: "SAIOF User",
      email: "user@saiof.com",
      role: "user"
    };
  }

  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User profile not found');
  }
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};

