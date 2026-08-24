const User = require('../models/User');
const { Op } = require('sequelize');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'refreshToken'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
    });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const { validatePasswordStrength } = require('../utils/passwordValidator');

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate password complexity
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      res.status(400);
      throw new Error(passwordCheck.message);
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409);
      throw new Error('User with this email already exists');
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, email, password, role, unlockAccount } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    // Unlock account if requested by admin
    if (unlockAccount) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }

    if (password) {
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.isValid) {
        res.status(400);
        throw new Error(passwordCheck.message);
      }
      user.password = password;
    }

    await user.save();

    res.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      res.status(400);
      throw new Error('You cannot delete your own account');
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
