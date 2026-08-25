const Product = require('../models/Product');
const User = require('../models/User');
const { Op } = require('sequelize');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      productType,
      sort = 'createdAt',
      order = 'DESC',
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: q } },
        { sku: { [Op.like]: q } },
        { productType: { [Op.like]: q } },
        { category: { [Op.like]: q } },
        { brand: { [Op.like]: q } },
        { capacity: { [Op.like]: q } },
        { phase: { [Op.like]: q } },
        { dcrType: { [Op.like]: q } },
        { subType: { [Op.like]: q } },
        { senderName: { [Op.like]: q } },
        { senderPhone: { [Op.like]: q } },
        { senderCompany: { [Op.like]: q } },
        { senderReason: { [Op.like]: q } },
        { location: { [Op.like]: q } },
        { description: { [Op.like]: q } },
      ];
    }
    if (category) {
      where.category = category;
    }

    // Godown / Location Access Control
    const user = req.user;
    const isStaffRestricted = user && user.role !== 'admin' && user.assignedLocation && user.assignedLocation !== 'All Locations';
    if (isStaffRestricted) {
      where.location = { [Op.like]: `%${user.assignedLocation}%` };
    } else if (req.query.location && req.query.location !== 'All Locations' && req.query.location !== 'all') {
      where.location = { [Op.like]: `%${req.query.location}%` };
    }

    if (productType) {
      if (productType === 'Ongrid Inverter') {
        where.productType = { [Op.or]: ['Ongrid Inverter', 'Inverters', 'Inverter'] };
      } else if (productType === 'Hybrid Inverter') {
        where.productType = { [Op.or]: ['Hybrid Inverter', 'Inverters', 'Hybrid'] };
      } else if (productType === 'Panels') {
        where.productType = { [Op.or]: ['Panels', 'Solar Panels', 'Solar Panels & Modules', 'Panel'] };
      } else if (productType === 'Battery') {
        where.productType = { [Op.or]: ['Battery', 'Batteries', 'Batteries & Energy Storage'] };
      } else if (productType === 'Structure') {
        where.productType = { [Op.or]: ['Structure', 'Structures', 'Mounting Structure & Hardware'] };
      } else if (productType === 'Wires') {
        where.productType = { [Op.or]: ['Wires', 'Cables & Wiring', 'Wire', 'Cable'] };
      } else if (productType === 'Consumable') {
        where.productType = { [Op.or]: ['Consumable', 'Consumables', 'Installation Consumables'] };
      } else if (productType === 'Spare') {
        where.productType = { [Op.or]: ['Spare', 'Spares', 'Maintenance Spares & Components'] };
      } else {
        where.productType = productType;
      }
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [[sort, order.toUpperCase()]],
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
    });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = async (req, res, next) => {
  try {
    const user = req.user;
    const isStaffRestricted = user && user.role !== 'admin' && user.assignedLocation && user.assignedLocation !== 'All Locations';
    const where = {
      quantity: {
        [Op.lte]: Product.sequelize.col('lowStockThreshold'),
      },
    };
    if (isStaffRestricted) {
      where.location = { [Op.like]: `%${user.assignedLocation}%` };
    }

    const products = await Product.findAll({
      where,
      order: [['quantity', 'ASC']],
    });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique categories
// @route   GET /api/products/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.findAll({
      attributes: [[Product.sequelize.fn('DISTINCT', Product.sequelize.col('category')), 'category']],
      order: [['category', 'ASC']],
    });

    res.json({
      success: true,
      data: categories.map((c) => c.category).filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique product types
// @route   GET /api/products/types
// @access  Private
const getProductTypes = async (req, res, next) => {
  try {
    const types = await Product.findAll({
      attributes: [[Product.sequelize.fn('DISTINCT', Product.sequelize.col('productType')), 'productType']],
      order: [['productType', 'ASC']],
    });

    res.json({
      success: true,
      data: types.map((t) => t.productType).filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      productType = 'Standard Product',
      category = 'General',
      unit = 'pcs',
      description,
      brand,
      capacity,
      phase,
      dcrType,
      subType,
      senderName,
      senderPhone,
      senderAddress,
      senderCompany,
      senderReason,
      serialNumbers = [],
      location,
      quantity,
      price,
      costPrice,
      lowStockThreshold,
    } = req.body;

    const uniqueId = (sku || req.body.uniqueId || '').trim();

    if (!name || !uniqueId) {
      res.status(400);
      throw new Error('Product Name and Unique ID / SKU are required');
    }

    const existingProduct = await Product.findOne({ where: { sku: uniqueId } });
    if (existingProduct) {
      res.status(409);
      throw new Error(`Product with Unique ID / SKU "${uniqueId}" already exists`);
    }

    // Clean serial numbers list
    const parsedSerialNumbers = Array.isArray(serialNumbers)
      ? serialNumbers.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const product = await Product.create({
      name: name.trim(),
      sku: uniqueId,
      productType: productType.trim(),
      category: category.trim(),
      unit: (unit || 'pcs').trim(),
      description: description || null,
      brand: brand ? brand.trim() : null,
      capacity: capacity ? capacity.trim() : null,
      phase: phase ? phase.trim() : null,
      dcrType: dcrType ? dcrType.trim() : null,
      subType: subType ? subType.trim() : null,
      senderName: senderName ? senderName.trim() : null,
      senderPhone: senderPhone ? senderPhone.trim() : null,
      senderAddress: senderAddress ? senderAddress.trim() : null,
      senderCompany: senderCompany ? senderCompany.trim() : null,
      senderReason: senderReason ? senderReason.trim() : null,
      serialNumbers: parsedSerialNumbers,
      location: location || null,
      quantity: Math.max(0, parseInt(quantity, 10) || (parsedSerialNumbers.length > 0 ? parsedSerialNumbers.length : 0)),
      price: Math.max(0, parseFloat(price) || 0),
      costPrice: Math.max(0, parseFloat(costPrice) || 0),
      lowStockThreshold: Math.max(0, parseInt(lowStockThreshold, 10) || 10),
      userId: req.user.id,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const {
      name,
      sku,
      productType,
      category,
      unit,
      description,
      brand,
      capacity,
      phase,
      dcrType,
      subType,
      senderName,
      senderPhone,
      senderAddress,
      senderCompany,
      senderReason,
      serialNumbers,
      location,
      price,
      costPrice,
      lowStockThreshold,
    } = req.body;

    if (sku !== undefined && sku.trim() !== product.sku) {
      const existing = await Product.findOne({ where: { sku: sku.trim() } });
      if (existing && existing.id !== product.id) {
        res.status(409);
        throw new Error(`Product with Unique ID / SKU "${sku}" already exists`);
      }
      product.sku = sku.trim();
    }

    if (name !== undefined) product.name = name.trim();
    if (productType !== undefined) product.productType = productType.trim();
    if (category !== undefined) product.category = category.trim();
    if (unit !== undefined) product.unit = unit.trim();
    if (description !== undefined) product.description = description;
    if (brand !== undefined) product.brand = brand ? brand.trim() : null;
    if (capacity !== undefined) product.capacity = capacity ? capacity.trim() : null;
    if (phase !== undefined) product.phase = phase ? phase.trim() : null;
    if (dcrType !== undefined) product.dcrType = dcrType ? dcrType.trim() : null;
    if (subType !== undefined) product.subType = subType ? subType.trim() : null;
    if (senderName !== undefined) product.senderName = senderName ? senderName.trim() : null;
    if (senderPhone !== undefined) product.senderPhone = senderPhone ? senderPhone.trim() : null;
    if (senderAddress !== undefined) product.senderAddress = senderAddress ? senderAddress.trim() : null;
    if (senderCompany !== undefined) product.senderCompany = senderCompany ? senderCompany.trim() : null;
    if (senderReason !== undefined) product.senderReason = senderReason ? senderReason.trim() : null;
    if (serialNumbers !== undefined && Array.isArray(serialNumbers)) {
      product.serialNumbers = serialNumbers.map((s) => String(s).trim()).filter(Boolean);
    }
    if (location !== undefined) product.location = location;
    if (price !== undefined) product.price = Math.max(0, parseFloat(price) || 0);
    if (costPrice !== undefined) product.costPrice = Math.max(0, parseFloat(costPrice) || 0);
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold, 10) || 0);

    await product.save();

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    await product.destroy();

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getLowStockProducts,
  getCategories,
  getProductTypes,
  createProduct,
  updateProduct,
  deleteProduct,
};
