const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getLowStockProducts,
  getCategories,
  getProductTypes,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect); // All product routes are protected

// Specific routes must come before parameterized routes
router.get('/low-stock', getLowStockProducts);
router.get('/categories', getCategories);
router.get('/types', getProductTypes);

router.route('/').get(getProducts).post(createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(authorize('admin'), deleteProduct);

module.exports = router;
