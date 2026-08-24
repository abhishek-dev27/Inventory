const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  bulkImportAccounts,
  syncFromCustomers,
  recordRecurringPayment,
} = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected for authenticated users (Admin & Staff)
router.use(protect);

router.route('/')
  .get(getAccounts)
  .post(createAccount);

router.post('/bulk-import', bulkImportAccounts);
router.post('/sync-customers', syncFromCustomers);
router.post('/:id/record-recurring', recordRecurringPayment);

router.route('/:id')
  .get(getAccountById)
  .put(updateAccount)
  .delete(deleteAccount);

module.exports = router;
