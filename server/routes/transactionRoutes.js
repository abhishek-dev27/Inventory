const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionById, updateTransaction } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);

module.exports = router;
