const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkImportCustomers,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

// All customer routes are protected (accessible by Admin, Manager, Staff)
router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.post('/bulk-import', bulkImportCustomers);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
