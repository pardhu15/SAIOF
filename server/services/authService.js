const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
