const StockTransaction = require('../models/StockTransaction');
const Product = require('../models/Product');
const User = require('../models/User');
const { Op } = require('sequelize');

const productAttributes = [
  'id',
  'name',
  'sku',
  'productType',
  'category',
  'brand',
  'capacity',
  'phase',
  'dcrType',
  'subType',
  'senderName',
  'senderPhone',
  'senderAddress',
  'senderCompany',
  'senderReason',
  'serialNumbers',
  'location',
  'unit',
  'price',
  'costPrice',
  'quantity',
  'lowStockThreshold',
  'description',
];

// @desc    Get all transactions (with filters & search)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      type,
      productId,
      productType,
      search,
      startDate,
      endDate,
      sort = 'createdAt',
      order = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (type && type !== 'ALL') where.type = type;
    if (productId) where.productId = productId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { personName: { [Op.like]: q } },
        { place: { [Op.like]: q } },
        { referenceNo: { [Op.like]: q } },
        { reason: { [Op.like]: q } },
        { notes: { [Op.like]: q } },
      ];
    }

    // Godown / Location Access Control
    const user = req.user;
    const isStaffRestricted = user && user.role !== 'admin' && user.assignedLocation && user.assignedLocation !== 'All Locations';
    if (isStaffRestricted) {
      where.place = { [Op.like]: `%${user.assignedLocation}%` };
    } else if (req.query.location && req.query.location !== 'All Locations' && req.query.location !== 'all') {
      where.place = { [Op.like]: `%${req.query.location}%` };
    }

    const productWhere = {};
    if (productType) {
      if (productType === 'Ongrid Inverter') {
        productWhere.productType = { [Op.or]: ['Ongrid Inverter', 'Inverters', 'Inverter'] };
      } else if (productType === 'Hybrid Inverter') {
        productWhere.productType = { [Op.or]: ['Hybrid Inverter', 'Inverters', 'Hybrid'] };
      } else if (productType === 'Panels') {
        productWhere.productType = { [Op.or]: ['Panels', 'Solar Panels', 'Solar Panels & Modules', 'Panel'] };
      } else if (productType === 'Battery') {
        productWhere.productType = { [Op.or]: ['Battery', 'Batteries', 'Batteries & Energy Storage'] };
      } else if (productType === 'Structure') {
        productWhere.productType = { [Op.or]: ['Structure', 'Structures', 'Mounting Structure & Hardware'] };
      } else if (productType === 'Wires') {
        productWhere.productType = { [Op.or]: ['Wires', 'Cables & Wiring', 'Wire', 'Cable'] };
      } else if (productType === 'Consumable') {
        productWhere.productType = { [Op.or]: ['Consumable', 'Consumables', 'Installation Consumables'] };
      } else if (productType === 'Spare') {
        productWhere.productType = { [Op.or]: ['Spare', 'Spares', 'Maintenance Spares & Components'] };
      } else {
        productWhere.productType = productType;
      }
    }

    const { count, rows: transactions } = await StockTransaction.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: productAttributes,
          ...(Object.keys(productWhere).length ? { where: productWhere, required: true } : {}),
        },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [[sort, order.toUpperCase()]],
    });

    res.json({
      success: true,
      data: transactions,
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

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await StockTransaction.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: productAttributes,
        },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransactions, getTransactionById };
