const express = require('express');
const router = express.Router();
const { stockIn, stockOut } = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/in', stockIn);
router.post('/out', stockOut);

module.exports = router;
