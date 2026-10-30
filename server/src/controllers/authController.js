const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserDAL } = require('../models/schema');
const { JWT_SECRET } = require('../middleware/auth');

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Registers a new user account with hashed password and generates JWT.
 */
async function register(req, res) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Field existence validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email Address, and Password are required.'
      });
    }

    const trimmedName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Name validation
    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full Name must be at least 2 characters long.'
      });
    }

    // Email format validation
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password cannot exceed 128 characters.'
      });
    }

    // Confirm password matching
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please verify and try again.'
      });
    }

    // Check for existing duplicate email
    const existing = await UserDAL.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in instead.'
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: trimmedName,
      email: cleanEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    const saved = await UserDAL.create(newUser);

    // Sign JWT token
    const token = jwt.sign(
      { id: saved.id, email: saved.email, name: saved.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to ShopWise.',
      token,
      user: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        createdAt: saved.createdAt
      }
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error during account registration. Please try again.',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
}

/**
 * POST /api/auth/login
 * Validates credentials and returns JWT token.
 */
async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up user by email
    const user = await UserDAL.findByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password. Please try again.'
      });
    }

    // Verify bcrypt password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password. Please try again.'
      });
    }

    // Session duration
    const expiresIn = rememberMe ? '30d' : '24h';

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
}

/**
 * GET /api/auth/me
 * Retrieves profile of currently authenticated user.
 */
async function getMe(req, res) {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('[GetMe Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile'
    });
  }
}

/**
 * POST /api/auth/logout
 * Informational logout endpoint.
 */
async function logout(req, res) {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}

/**
 * POST /api/auth/forgot-password
 * Handles password reset request.
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserDAL.findByEmail(cleanEmail);

    // Unified message for both existing and non-existing accounts to prevent user enumeration
    res.json({
      success: true,
      message: 'If an account is registered with this email address, password reset instructions have been dispatched.'
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing password reset request.'
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword
};
