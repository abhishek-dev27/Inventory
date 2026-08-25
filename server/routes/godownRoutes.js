const express = require('express');
const router = express.Router();
const {
  getGodowns,
  getGodownById,
  createGodown,
  updateGodown,
  deleteGodown,
} = require('../controllers/godownController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getGodowns)
  .post(authorize('admin'), createGodown);

router.route('/:id')
  .get(getGodownById)
  .put(authorize('admin'), updateGodown)
  .delete(authorize('admin'), deleteGodown);

module.exports = router;
