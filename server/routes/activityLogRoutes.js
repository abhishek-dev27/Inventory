const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  getActivityStats,
  clearActivityLogs,
} = require('../controllers/activityLogController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All activity log routes are admin-only
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getActivityLogs)
  .delete(clearActivityLogs);

router.get('/stats', getActivityStats);

module.exports = router;
