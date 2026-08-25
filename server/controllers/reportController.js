const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/db');
const StockTransaction = require('../models/StockTransaction');
const Product = require('../models/Product');
const User = require('../models/User');
const { getDayRange, getMonthRange, buildDateFilter } = require('../utils/reportUtils');

// @desc    Dashboard stats
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const user = req.user;
    const isStaffRestricted = user && user.role !== 'admin' && user.assignedLocation && user.assignedLocation !== 'All Locations';
    const prodWhere = {};
    if (isStaffRestricted) {
      prodWhere.location = { [Op.like]: `%${user.assignedLocation}%` };
    } else if (req.query.location && req.query.location !== 'All Locations' && req.query.location !== 'all') {
      prodWhere.location = { [Op.like]: `%${req.query.location}%` };
    }

    // 1. Fetch products to aggregate total stock, valuation & category breakdown
    const allProducts = await Product.findAll({
      where: prodWhere,
      attributes: ['id', 'name', 'productType', 'category', 'quantity', 'price', 'lowStockThreshold', 'sku', 'location'],
    });

    const totalProducts = allProducts.length;
    let totalQuantity = 0;
    let totalValue = 0;
    let lowStockCount = 0;

    const standardTypes = [
      'Ongrid Inverter',
      'Hybrid Inverter',
      'Panels',
      'MCB',
      'MSB',
      'Wires',
      'Structure',
      'Consumable',
      'Spare',
    ];

    const typeMap = {};
    standardTypes.forEach((t) => {
      typeMap[t] = {
        name: t,
        totalQuantity: 0,
        totalValuation: 0,
        productCount: 0,
      };
    });

    allProducts.forEach((p) => {
      const qty = parseInt(p.quantity, 10) || 0;
      const price = parseFloat(p.price) || 0;
      const threshold = parseInt(p.lowStockThreshold, 10) || 0;

      totalQuantity += qty;
      totalValue += qty * price;
      if (qty <= threshold) {
        lowStockCount += 1;
      }

      const type = p.productType || 'Other';
      if (!typeMap[type]) {
        typeMap[type] = {
          name: type,
          totalQuantity: 0,
          totalValuation: 0,
          productCount: 0,
        };
      }
      typeMap[type].totalQuantity += qty;
      typeMap[type].totalValuation += qty * price;
      typeMap[type].productCount += 1;
    });

    const productTypeBreakdown = Object.values(typeMap);

    // 2. Godown-wise breakdown
    const GODOWNS = ['Ranchi', 'Jamshedpur', 'Hazaribagh', 'Patna', 'Daltonganj'];
    const godownMap = {};
    GODOWNS.forEach((g) => {
      godownMap[g] = {
        name: g,
        totalQuantity: 0,
        productCount: 0,
        totalValuation: 0,
        lowStockCount: 0,
      };
    });

    allProducts.forEach((p) => {
      const qty = parseInt(p.quantity, 10) || 0;
      const price = parseFloat(p.price) || 0;
      const threshold = parseInt(p.lowStockThreshold, 10) || 0;
      const loc = (p.location || '').trim();

      let matchedGodown = GODOWNS.find((g) => loc.toLowerCase().includes(g.toLowerCase()));
      if (!matchedGodown) {
        matchedGodown = 'Ranchi';
      }

      godownMap[matchedGodown].totalQuantity += qty;
      godownMap[matchedGodown].productCount += 1;
      godownMap[matchedGodown].totalValuation += qty * price;
      if (qty <= threshold) {
        godownMap[matchedGodown].lowStockCount += 1;
      }
    });

    let godownBreakdown = GODOWNS.map((g) => godownMap[g]);
    if (isStaffRestricted) {
      godownBreakdown = godownBreakdown.filter(
        (g) => g.name.toLowerCase() === user.assignedLocation.toLowerCase()
      );
    }

    // 3. Today's transactions (strictly scoped by location for staff)
    const { start, end } = getDayRange();
    const txWhere = { createdAt: { [Op.between]: [start, end] } };
    if (isStaffRestricted) {
      txWhere[Op.or] = [
        { place: { [Op.like]: `%${user.assignedLocation}%` } },
        { senderAddress: { [Op.like]: `%${user.assignedLocation}%` } },
        { notes: { [Op.like]: `%${user.assignedLocation}%` } },
      ];
    }

    const todayTransactions = await StockTransaction.count({
      where: txWhere,
    });

    const todayStockIn = (await StockTransaction.sum('quantity', {
      where: { ...txWhere, type: 'in' },
    })) || 0;

    const todayStockOut = (await StockTransaction.sum('quantity', {
      where: { ...txWhere, type: 'out' },
    })) || 0;

    // 4. Recent activity (last 10 transactions)
    const recentWhere = {};
    if (isStaffRestricted) {
      recentWhere[Op.or] = [
        { place: { [Op.like]: `%${user.assignedLocation}%` } },
        { senderAddress: { [Op.like]: `%${user.assignedLocation}%` } },
        { notes: { [Op.like]: `%${user.assignedLocation}%` } },
      ];
    }

    const recentActivity = await StockTransaction.findAll({
      where: recentWhere,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        totalQuantity,
        lowStockCount,
        totalValue: parseFloat(totalValue).toFixed(2),
        todayTransactions,
        todayStockIn,
        todayStockOut,
        recentActivity,
        productTypeBreakdown,
        godownBreakdown,
        assignedLocation: isStaffRestricted ? user.assignedLocation : 'All Locations',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Daily report
// @route   GET /api/reports/daily
// @access  Private
const getDailyReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const { start, end } = getDayRange(date);

    const transactions = await StockTransaction.findAll({
      where: { createdAt: { [Op.between]: [start, end] } },
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'category'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const totalIn = transactions
      .filter((t) => t.type === 'in')
      .reduce((sum, t) => sum + t.quantity, 0);

    const totalOut = transactions
      .filter((t) => t.type === 'out')
      .reduce((sum, t) => sum + t.quantity, 0);

    res.json({
      success: true,
      data: {
        date: start.toISOString().split('T')[0],
        totalTransactions: transactions.length,
        totalIn,
        totalOut,
        netChange: totalIn - totalOut,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Monthly report
// @route   GET /api/reports/monthly
// @access  Private
const getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const y = year ? parseInt(year) : new Date().getFullYear();
    const m = month !== undefined ? parseInt(month) - 1 : new Date().getMonth();
    const { start, end } = getMonthRange(y, m);

    // Daily breakdown for the month
    const dailyBreakdown = await StockTransaction.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        'type',
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('COUNT', col('id')), 'transactionCount'],
      ],
      where: { createdAt: { [Op.between]: [start, end] } },
      group: [fn('DATE', col('createdAt')), 'type'],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    });

    // Summary
    const totalIn = (await StockTransaction.sum('quantity', {
      where: { type: 'in', createdAt: { [Op.between]: [start, end] } },
    })) || 0;

    const totalOut = (await StockTransaction.sum('quantity', {
      where: { type: 'out', createdAt: { [Op.between]: [start, end] } },
    })) || 0;

    const totalTransactions = await StockTransaction.count({
      where: { createdAt: { [Op.between]: [start, end] } },
    });

    res.json({
      success: true,
      data: {
        year: y,
        month: m + 1,
        totalTransactions,
        totalIn,
        totalOut,
        netChange: totalIn - totalOut,
        dailyBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Usage report — most used/consumed products
// @route   GET /api/reports/usage
// @access  Private
const getUsageReport = async (req, res, next) => {
  try {
    const { startDate, endDate, type = 'out', limit = 20 } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);

    const usage = await StockTransaction.findAll({
      attributes: [
        'productId',
        [fn('SUM', col('StockTransaction.quantity')), 'totalQuantity'],
        [fn('COUNT', col('StockTransaction.id')), 'transactionCount'],
      ],
      where: { type, ...dateFilter },
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'category', 'quantity'] },
      ],
      group: ['productId', 'product.id'],
      order: [[fn('SUM', col('StockTransaction.quantity')), 'DESC']],
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stock chart data (last 7 or 30 days)
// @route   GET /api/reports/chart
// @access  Private
const getStockChartData = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const chartData = await StockTransaction.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        'type',
        [fn('SUM', col('quantity')), 'totalQuantity'],
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
      },
      group: [fn('DATE', col('createdAt')), 'type'],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    });

    res.json({ success: true, data: chartData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDailyReport,
  getMonthlyReport,
  getUsageReport,
  getStockChartData,
};
