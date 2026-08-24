const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDailyReport,
  getMonthlyReport,
  getUsageReport,
  getStockChartData,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);
router.get('/usage', getUsageReport);
router.get('/chart', getStockChartData);

module.exports = router;
