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

    const { count, rows: transactions } = await StockTransaction.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: productAttributes,
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
