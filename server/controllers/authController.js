const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { recordActivity } = require('../utils/clientInfo');

// @desc    Login user with mobile number, username, or email
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, username, phone, identifier, password } = req.body;
    const loginIdentifier = (identifier || email || username || phone || '').trim();

    if (!loginIdentifier || !password) {
      res.status(400);
      throw new Error('Please enter your mobile number or username and password');
    }

    const rawKey = loginIdentifier.trim();
    const cleanKey = rawKey.toLowerCase();
    const prefixKey = cleanKey.includes('@') ? cleanKey.split('@')[0] : cleanKey;
    const cleanDigits = rawKey.replace(/[^0-9]/g, '');

    const queryConditions = [
      { username: rawKey },
      { username: cleanKey },
      { username: prefixKey },
      { phone: rawKey },
      { phone: cleanKey },
      { email: rawKey },
      { email: cleanKey },
      { name: rawKey },
    ];

    if (cleanDigits.length >= 10) {
      const tenDigits = cleanDigits.slice(-10);
      queryConditions.push({ phone: { [Op.like]: `%${tenDigits}%` } });
    }

    if (prefixKey) {
      queryConditions.push({ email: { [Op.like]: `${prefixKey}@%` } });
      queryConditions.push({ name: { [Op.like]: `%${prefixKey}%` } });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: queryConditions,
      },
    });

    // Check if account is currently locked
    if (user && user.isLocked()) {
      const remainingMinutes = Math.ceil((new Date(user.lockUntil) - new Date()) / 60000);
      await recordActivity(req, {
        userId: user.id,
        userName: user.name,
        userEmail: email,
        role: user.role,
        action: 'LOGIN_BLOCKED',
        status: 'FAILED',
        details: `Account temporarily locked. ${remainingMinutes}m remaining.`,
      });

      res.status(423); // 423 Locked
      throw new Error(`Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`);
    }

    if (!user || !(await user.matchPassword(password))) {
      let attemptsRemaining = 5;

      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
          await user.save({ hooks: false });

          await recordActivity(req, {
            userId: user.id,
            userName: user.name,
            userEmail: email,
            role: user.role,
            action: 'ACCOUNT_LOCKED',
            status: 'FAILED',
            details: 'Account locked for 15 minutes after 5 failed login attempts',
          });

          res.status(423);
          throw new Error('Account locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.');
        } else {
          attemptsRemaining = 5 - user.failedLoginAttempts;
          await user.save({ hooks: false });
        }
      }

      // Record failed login attempt
      await recordActivity(req, {
        userId: user ? user.id : null,
        userName: user ? user.name : null,
        userEmail: email,
        role: user ? user.role : null,
        action: 'LOGIN_FAILED',
        status: 'FAILED',
        details: `Invalid credentials. ${attemptsRemaining} attempts left.`,
      });

      res.status(401);
      throw new Error(
        user
          ? `Invalid email or password. You have ${attemptsRemaining} attempt(s) remaining before account lockout.`
          : 'Invalid email or password'
      );
    }

    // Password is correct — reset failed attempts & lockout
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ hooks: false });

    // Set HttpOnly Secure Cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Record successful login
    await recordActivity(req, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      action: 'LOGIN',
      status: 'SUCCESS',
      details: `Successful login as ${user.role}`,
    });

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(400);
      throw new Error('Refresh token is required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      res.status(401);
      throw new Error('Invalid or expired refresh token');
    }

    // Find user with matching refresh token
    const user = await User.findOne({
      where: { id: decoded.id, refreshToken },
    });

    if (!user) {
      res.status(401);
      throw new Error('Invalid refresh token — user not found or token revoked');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save({ hooks: false });

    // Set updated HttpOnly Cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (revoke refresh token)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save({ hooks: false });

      await recordActivity(req, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        action: 'LOGOUT',
        status: 'SUCCESS',
        details: 'User logged out',
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refreshAccessToken, logout, getMe };
