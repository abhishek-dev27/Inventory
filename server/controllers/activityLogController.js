const { Op } = require('sequelize');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// @desc    Get paginated activity / login logs
// @route   GET /api/activity-logs
// @access  Private (Admin only)
const getActivityLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { search, action, status, role, startDate, endDate } = req.query;

    const where = {};

    // Filter by action
    if (action && action !== 'ALL') {
      where.action = action;
    }

    // Filter by status
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Filter by role
    if (role && role !== 'ALL') {
      where.role = role;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    // Search query
    if (search && search.trim()) {
      const query = `%${search.trim()}%`;
      where[Op.or] = [
        { userName: { [Op.like]: query } },
        { userEmail: { [Op.like]: query } },
        { ipAddress: { [Op.like]: query } },
        { location: { [Op.like]: query } },
        { device: { [Op.like]: query } },
        { browser: { [Op.like]: query } },
        { os: { [Op.like]: query } },
        { details: { [Op.like]: query } },
      ];
    }

    const { count, rows: logs } = await ActivityLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: count,
        page,
        totalPages,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get login activity statistics
// @route   GET /api/activity-logs/stats
// @access  Private (Admin only)
const getActivityStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalActivities,
      totalLogins,
      successfulLogins,
      failedLogins,
      todayLogins,
      uniqueUsers,
    ] = await Promise.all([
      ActivityLog.count(),
      ActivityLog.count({ where: { action: { [Op.in]: ['LOGIN', 'LOGIN_FAILED'] } } }),
      ActivityLog.count({ where: { action: 'LOGIN', status: 'SUCCESS' } }),
      ActivityLog.count({ where: { status: 'FAILED' } }),
      ActivityLog.count({
        where: {
          createdAt: { [Op.gte]: startOfToday },
        },
      }),
      ActivityLog.count({
        distinct: true,
        col: 'userEmail',
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalActivities,
        totalLogins,
        successfulLogins,
        failedLogins,
        todayLogins,
        uniqueUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear activity logs
// @route   DELETE /api/activity-logs
// @access  Private (Admin only)
const clearActivityLogs = async (req, res, next) => {
  try {
    const { days } = req.query;

    if (days && !isNaN(days)) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days, 10));

      const deletedCount = await ActivityLog.destroy({
        where: {
          createdAt: { [Op.lt]: cutoff },
        },
      });

      return res.json({
        success: true,
        message: `Deleted ${deletedCount} logs older than ${days} days`,
      });
    }

    // Delete all
    const deletedCount = await ActivityLog.destroy({ where: {}, truncate: true });
    res.json({
      success: true,
      message: 'All activity logs cleared successfully',
      count: deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
  getActivityStats,
  clearActivityLogs,
};
