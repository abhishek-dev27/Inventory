const { sequelize } = require('../config/db');
const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');
const User = require('../models/User');

const productAttributes = [
  'id',
  'name',
  'sku',
  'productType',
  'category',
  'brand',
  'capacity',
  'phase',
  'dcrType',
  'subType',
  'senderName',
  'senderPhone',
  'senderAddress',
  'senderCompany',
  'senderReason',
  'serialNumbers',
  'location',
  'unit',
  'price',
  'costPrice',
  'quantity',
  'lowStockThreshold',
  'description',
];

// @desc    Stock In — add stock to a product
// @route   POST /api/stock/in
// @access  Private
const stockIn = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const {
      items, // Multi-item inward array: [{ productId, quantity, serialNumbers }]
      productId, // Single-item fallback
      quantity,
      reason,
      personName,
      senderPhone,
      senderAddress,
      senderCompany,
      place,
      referenceNo,
      serialNumbers = [],
      notes,
      transactionDate,
    } = req.body;

    if (!reason?.trim()) {
      res.status(400);
      throw new Error('Inward reason is required');
    }

    // Normalize items array
    const inwardItems =
      Array.isArray(items) && items.length > 0
        ? items
        : productId && quantity
        ? [{ productId, quantity, serialNumbers }]
        : [];

    if (inwardItems.length === 0) {
      res.status(400);
      throw new Error('At least one product item must be added to the inward bill');
    }

    const billRef = referenceNo?.trim() || `INW-${Date.now().toString().slice(-6)}`;
    const isAdmin = req.user && req.user.role === 'admin';
    const txDate = isAdmin && transactionDate ? new Date(transactionDate) : new Date();

    const createdTxIds = [];

    // Process each item in the inward bill
    for (const item of inwardItems) {
      const pId = parseInt(item.productId, 10);
      const qty = parseInt(item.quantity, 10);

      if (!pId || isNaN(qty) || qty <= 0) {
        res.status(400);
        throw new Error('Each item must have a valid product and quantity greater than 0');
      }

      const product = await Product.findByPk(pId, { transaction: t });
      if (!product) {
        res.status(404);
        throw new Error(`Product with ID ${pId} not found`);
      }

      // Update product quantity
      product.quantity += qty;

      // Append any new serial numbers
      const newSerials = Array.isArray(item.serialNumbers)
        ? item.serialNumbers.map((s) => String(s).trim()).filter(Boolean)
        : [];

      if (newSerials.length > 0) {
        const existingSerials = Array.isArray(product.serialNumbers) ? product.serialNumbers : [];
        product.serialNumbers = Array.from(new Set([...existingSerials, ...newSerials]));
      }

      // If spare material, also optionally update sender record on product
      if (product.productType === 'Spare' && personName) {
        product.senderName = personName.trim();
        if (senderPhone) product.senderPhone = senderPhone.trim();
        if (senderAddress) product.senderAddress = senderAddress.trim();
        if (senderCompany) product.senderCompany = senderCompany.trim();
        if (reason) product.senderReason = reason.trim();
      }

      await product.save({ transaction: t });

      // Create transaction record for each item
      const tx = await StockTransaction.create(
        {
          productId: pId,
          userId: req.user.id,
          type: 'in',
          quantity: qty,
          reason: reason.trim(),
          personName: personName ? personName.trim() : null,
          senderPhone: senderPhone ? senderPhone.trim() : null,
          senderAddress: senderAddress ? senderAddress.trim() : null,
          senderCompany: senderCompany ? senderCompany.trim() : null,
          place: place ? place.trim() : null,
          referenceNo: billRef,
          serialNumbers: newSerials,
          notes: notes ? notes.trim() : null,
          transactionDate: txDate,
        },
        { transaction: t }
      );

      createdTxIds.push(tx.id);
    }

    await t.commit();

    // Fetch full transactions for created items
    const transactions = await StockTransaction.findAll({
      where: { id: createdTxIds },
      include: [
        { model: Product, as: 'product', attributes: productAttributes },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.status(201).json({
      success: true,
      data: transactions[0] || null,
      transactions,
      billReference: billRef,
      itemCount: inwardItems.length,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// @desc    Stock Out — remove stock from product(s) in a single bill / dispatch
// @route   POST /api/stock/out
// @access  Private
const stockOut = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const {
      items, // Multi-item array: [{ productId, quantity, serialNumbers }]
      productId, // Single-item fallback
      quantity,
      serialNumbers = [],
      reason = 'Project Site Dispatch',
      personName, // Receiver / Consignee name
      place, // Destination site / address
      referenceNo, // Bill / Challan / Voucher #
      notes,
      transactionDate,
    } = req.body;

    if (!personName?.trim()) {
      res.status(400);
      throw new Error('Receiver / Consignee person name is required');
    }

    if (!place?.trim()) {
      res.status(400);
      throw new Error('Place / Destination project site is required');
    }

    // Normalize items array
    const dispatchItems = Array.isArray(items) && items.length > 0
      ? items
      : productId && quantity
      ? [{ productId, quantity, serialNumbers }]
      : [];

    if (dispatchItems.length === 0) {
      res.status(400);
      throw new Error('At least one product item must be added to the dispatch bill');
    }

    // Generate shared bill reference if not provided
    const billRef = referenceNo?.trim() || `BILL-${Date.now().toString().slice(-6)}`;
    const isAdmin = req.user && req.user.role === 'admin';
    const txDate = isAdmin && transactionDate ? new Date(transactionDate) : new Date();

    const createdTxIds = [];

    // Process each item in the bill
    for (const item of dispatchItems) {
      const pId = parseInt(item.productId, 10);
      const qty = parseInt(item.quantity, 10);

      if (!pId || isNaN(qty) || qty <= 0) {
        res.status(400);
        throw new Error('Each item must have a valid product and quantity greater than 0');
      }

      const product = await Product.findByPk(pId, { transaction: t });
      if (!product) {
        res.status(404);
        throw new Error(`Product with ID ${pId} not found`);
      }

      if (product.quantity < qty) {
        res.status(400);
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.quantity} ${product.unit || 'pcs'}, Requested in bill: ${qty}`
        );
      }

      // Deduct quantity
      product.quantity -= qty;

      // Deduct dispatched serial numbers
      const dispatchedSerials = Array.isArray(item.serialNumbers)
        ? item.serialNumbers.map((s) => String(s).trim()).filter(Boolean)
        : [];

      if (dispatchedSerials.length > 0 && Array.isArray(product.serialNumbers)) {
        const dispatchedSet = new Set(dispatchedSerials);
        product.serialNumbers = product.serialNumbers.filter((s) => !dispatchedSet.has(s));
      }

      await product.save({ transaction: t });

      // Create transaction record for this item with the shared dispatch reference
      const tx = await StockTransaction.create(
        {
          productId: pId,
          userId: req.user.id,
          type: 'out',
          quantity: qty,
          reason,
          personName: personName.trim(),
          place: place.trim(),
          referenceNo: billRef,
          serialNumbers: dispatchedSerials,
          notes: notes?.trim() || null,
          transactionDate: txDate,
        },
        { transaction: t }
      );

      createdTxIds.push(tx.id);
    }

    await t.commit();

    // Fetch all created transactions for the bill
    const fullTransactions = await StockTransaction.findAll({
      where: { id: createdTxIds },
      include: [
        { model: Product, as: 'product', attributes: productAttributes },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.status(201).json({
      success: true,
      message: `Successfully dispatched ${dispatchItems.length} item(s) under Bill #${billRef}`,
      billReference: billRef,
      data: fullTransactions.length === 1 ? fullTransactions[0] : fullTransactions,
      items: fullTransactions,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = { stockIn, stockOut };
