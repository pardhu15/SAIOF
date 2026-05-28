const authService = require('../services/authService');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide both email and password');
    }

    const result = await authService.loginUser(email, password);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    if (res.statusCode === 200) res.status(401);
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const profile = async (req, res, next) => {
  try {
    const result = await authService.getUserProfile(req.user._id);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

module.exports = {
  register,
  login,
  profile
};
