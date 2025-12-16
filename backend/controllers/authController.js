const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { username, email, firstName, lastName, dateOfBirth, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    // Hash password before creating user
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: new Date(dateOfBirth),
      password: hashedPassword,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Check for account lockout
    const attemptData = loginAttempts.get(clientIP);
    if (attemptData && attemptData.lockedUntil > Date.now()) {
      const remainingTime = Math.ceil((attemptData.lockedUntil - Date.now()) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please try again in ${remainingTime} minute(s)`,
      });
    }

    // Check if user exists and get password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      // Increment failed attempts
      if (!attemptData) {
        loginAttempts.set(clientIP, { count: 1, lockedUntil: null });
      } else {
        attemptData.count += 1;
        if (attemptData.count >= MAX_LOGIN_ATTEMPTS) {
          attemptData.lockedUntil = Date.now() + LOCKOUT_TIME;
        }
        loginAttempts.set(clientIP, attemptData);
      }

      // Generic error message for security (don't reveal if user exists)
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      const remainingTime = Math.ceil((user.accountLockedUntil - Date.now()) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Account is temporarily locked. Please try again in ${remainingTime} minute(s)`,
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      
      if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.accountLockedUntil = new Date(Date.now() + LOCKOUT_TIME);
      }
      await user.save();

      // Also track by IP
      if (!attemptData) {
        loginAttempts.set(clientIP, { count: 1, lockedUntil: null });
      } else {
        attemptData.count += 1;
        if (attemptData.count >= MAX_LOGIN_ATTEMPTS) {
          attemptData.lockedUntil = Date.now() + LOCKOUT_TIME;
        }
        loginAttempts.set(clientIP, attemptData);
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Clear IP-based lockout
    loginAttempts.delete(clientIP);

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    // Balance is not in select: false, so we can access it directly
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Ensure balance is a number
    const balance = typeof user.balance === 'number' ? user.balance : 0;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        balance: balance,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

