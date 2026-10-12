const Godown = require('../models/Godown');
const Product = require('../models/Product');
const User = require('../models/User');
const { Op } = require('sequelize');
const { recordActivity } = require('../utils/clientInfo');

// Default initial godowns
const DEFAULT_GODOWNS = ['Ranchi', 'Jamshedpur', 'Hazaribagh', 'Patna', 'Daltonganj'];

// Seed default godowns if empty
const seedDefaultGodowns = async () => {
  try {
    const count = await Godown.count();
    if (count === 0) {
      for (const name of DEFAULT_GODOWNS) {
        await Godown.findOrCreate({
          where: { name },
          defaults: {
            name,
            code: name.substring(0, 3).toUpperCase(),
            city: name,
            state: name === 'Patna' ? 'Bihar' : 'Jharkhand',
            status: 'active',
            isDefault: true,
          },
        });
      }
    }
  } catch (e) {
    console.error('Error seeding default godowns:', e.message);
  }
};

// @desc    Get all godowns
// @route   GET /api/godowns
// @access  Private
const getGodowns = async (req, res, next) => {
  try {
    await seedDefaultGodowns();

    const godowns = await Godown.findAll({
      where: { status: 'active' },
      order: [['id', 'ASC']],
    });

    res.json({
      success: true,
      data: godowns,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single godown
// @route   GET /api/godowns/:id
// @access  Private
const getGodownById = async (req, res, next) => {
  try {
    const godown = await Godown.findByPk(req.params.id);
    if (!godown) {
      res.status(404);
      throw new Error('Godown not found');
    }
    res.json({ success: true, data: godown });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new godown
// @route   POST /api/godowns
// @access  Private (Admin)
const createGodown = async (req, res, next) => {
  try {
    const { name, code, address, city, state, contactPerson, contactPhone } = req.body;

    if (!name || !name.trim()) {
      res.status(400);
      throw new Error('Godown name is required');
    }

    const cleanName = name.trim();

    // Check duplicate
    const existing = await Godown.findOne({
      where: { name: cleanName },
    });
    if (existing) {
      res.status(409);
      throw new Error(`Godown with name "${cleanName}" already exists`);
    }

    const godown = await Godown.create({
      name: cleanName,
      code: code ? code.trim().toUpperCase() : cleanName.substring(0, 3).toUpperCase(),
      address: address ? address.trim() : null,
      city: city ? city.trim() : cleanName,
      state: state ? state.trim() : 'Jharkhand',
      contactPerson: contactPerson ? contactPerson.trim() : null,
      contactPhone: contactPhone ? contactPhone.trim() : null,
      status: 'active',
    });

    await recordActivity(req, {
      userId: req.user?.id,
      userName: req.user?.name,
      userEmail: req.user?.email,
      role: req.user?.role,
      action: 'GODOWN_CREATED',
      status: 'SUCCESS',
      details: `Created new Godown: ${cleanName} (${godown.code})`,
    });

    res.status(201).json({
      success: true,
      data: godown,
      message: `Godown "${cleanName}" added successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a godown
// @route   PUT /api/godowns/:id
// @access  Private (Admin)
const updateGodown = async (req, res, next) => {
  try {
    const godown = await Godown.findByPk(req.params.id);
    if (!godown) {
      res.status(404);
      throw new Error('Godown not found');
    }

    const { name, code, address, city, state, contactPerson, contactPhone, status } = req.body;

    if (name) godown.name = name.trim();
    if (code) godown.code = code.trim().toUpperCase();
    if (address !== undefined) godown.address = address ? address.trim() : null;
    if (city !== undefined) godown.city = city ? city.trim() : null;
    if (state !== undefined) godown.state = state ? state.trim() : null;
    if (contactPerson !== undefined) godown.contactPerson = contactPerson ? contactPerson.trim() : null;
    if (contactPhone !== undefined) godown.contactPhone = contactPhone ? contactPhone.trim() : null;
    if (status !== undefined) godown.status = status;

    await godown.save();

    res.json({
      success: true,
      data: godown,
      message: 'Godown updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a godown
// @desc    Delete a godown (Admin only)
// @route   DELETE /api/godowns/:id
// @access  Private (Admin)
const deleteGodown = async (req, res, next) => {
  try {
    const identifier = req.params.id;
    let godown = null;

    if (!isNaN(identifier)) {
      godown = await Godown.findByPk(identifier);
    }
    if (!godown) {
      godown = await Godown.findOne({
        where: {
          [Op.or]: [
            { name: identifier },
            { id: isNaN(identifier) ? -1 : identifier },
          ],
        },
      });
    }

    if (!godown) {
      res.status(404);
      throw new Error('Godown not found');
    }

    const deletedName = godown.name;

    // Safely unassign products currently referencing this godown so any godown can be deleted
    try {
      await Product.update(
        { location: 'Unassigned' },
        {
          where: {
            location: { [Op.like]: `%${deletedName}%` },
          },
        }
      );
    } catch (err) {
      console.warn('Could not update product locations on godown deletion:', err.message);
    }

    // Safely reassign any users designated to this godown to 'All Locations'
    try {
      await User.update(
        { assignedLocation: 'All Locations' },
        {
          where: {
            assignedLocation: deletedName,
          },
        }
      );
    } catch (err) {
      console.warn('Could not update user assigned locations on godown deletion:', err.message);
    }

    await godown.destroy();

    await recordActivity(req, {
      userId: req.user?.id,
      userName: req.user?.name,
      userEmail: req.user?.email,
      role: req.user?.role,
      action: 'GODOWN_DELETED',
      status: 'SUCCESS',
      details: `Deleted Godown: ${deletedName}`,
    });

    res.json({
      success: true,
      message: `Godown "${deletedName}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGodowns,
  getGodownById,
  createGodown,
  updateGodown,
  deleteGodown,
  seedDefaultGodowns,
};
