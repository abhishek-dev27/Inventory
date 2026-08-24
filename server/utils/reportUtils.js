const { Op } = require('sequelize');

/**
 * Get the start and end of a given date (for daily queries)
 */
const getDayRange = (dateString) => {
  const date = dateString ? new Date(dateString) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
};

/**
 * Get the start and end of a given month (for monthly queries)
 */
const getMonthRange = (year, month) => {
  const y = year || new Date().getFullYear();
  const m = month !== undefined ? month : new Date().getMonth();
  const start = new Date(y, m, 1, 0, 0, 0);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

/**
 * Build a date range filter for Sequelize queries
 */
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  } else if (startDate) {
    filter.createdAt = {
      [Op.gte]: new Date(startDate),
    };
  } else if (endDate) {
    filter.createdAt = {
      [Op.lte]: new Date(endDate),
    };
  }
  return filter;
};

/**
 * Calculate percentage change between two values
 */
const calcPercentChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

module.exports = { getDayRange, getMonthRange, buildDateFilter, calcPercentChange };
