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
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: q } },
        { username: { [Op.like]: q } },
        { phone: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { address: { [Op.like]: q } },
        { assignedLocation: { [Op.like]: q } },
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
    const { name, username, phone, email, password, role, assignedLocation, address } = req.body;

    if (!name || !name.trim()) {
      res.status(400);
      throw new Error('Full Name is required');
    }

    // Auto-generate username from name if not provided
    const cleanUsername = (username || name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanEmail = email ? String(email).trim() : `${cleanUsername || Date.now()}@sologix.local`;

    // Validate password complexity
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      res.status(400);
      throw new Error(passwordCheck.message);
    }

    // Check duplicate username if specified
    if (cleanUsername) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: cleanUsername },
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ],
        },
      });
      if (existingUser) {
        res.status(409);
        throw new Error('A user with this username or mobile number already exists');
      }
    }

    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      phone: cleanPhone,
      email: cleanEmail,
      password,
      role: role || 'staff',
      assignedLocation: assignedLocation || 'All Locations',
      address: address ? address.trim() : null,
    });

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

    const { name, username, phone, email, password, role, assignedLocation, address, unlockAccount } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (username !== undefined) user.username = username ? username.trim().toLowerCase() : user.username;
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;
    if (email !== undefined) user.email = email ? email.trim() : user.email;
    if (role !== undefined) user.role = role;
    if (assignedLocation !== undefined) user.assignedLocation = assignedLocation;
    if (address !== undefined) user.address = address ? address.trim() : null;

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
