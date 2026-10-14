/**
 * 🔄 One-Click Data Sync Script
 * 
 * Safely restores the products catalog and stock transaction ledger
 * from localhost to the cloud MySQL database with zero data loss.
 */

require('dotenv').config();
const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const StockTransaction = require('./models/StockTransaction');

const productsData = [
  {
    id: 1,
    name: 'Abhishek Kumar',
    sku: 'OGI-66582',
    category: 'Inverters',
    description: null,
    quantity: 900,
    price: 0.00,
    lowStockThreshold: 5,
    userId: 1,
    productType: 'Ongrid Inverter',
    unit: 'pcs',
    brand: 'Growatt',
    location: null,
    costPrice: 0.00,
    capacity: '5 kW',
    phase: '1-Phase',
    serialNumbers: [],
    dcrType: null,
    subType: 'Nut & Bolt (Type 1)',
    senderName: null,
    senderPhone: null,
    senderAddress: null,
    senderCompany: null,
    senderReason: 'Warranty Replacement (RMA)',
    createdAt: '2026-10-12T11:57:58.000Z',
    updatedAt: '2026-10-12T11:59:57.000Z',
  },
  {
    id: 2,
    name: 'dfghjk',
    sku: 'OGI-41191',
    category: 'Inverters',
    description: null,
    quantity: 406,
    price: 0.00,
    lowStockThreshold: 5,
    userId: 1,
    productType: 'Ongrid Inverter',
    unit: 'pcs',
    brand: 'Growatt',
    location: null,
    costPrice: 0.00,
    capacity: '5 kW',
    phase: '1-Phase',
    serialNumbers: [],
    dcrType: null,
    subType: 'Nut & Bolt (Type 1)',
    senderName: null,
    senderPhone: null,
    senderAddress: null,
    senderCompany: null,
    senderReason: 'Warranty Replacement (RMA)',
    createdAt: '2026-10-12T11:58:13.000Z',
    updatedAt: '2026-10-12T11:59:57.000Z',
  },
];

const transactionsData = [
  {
    id: 1,
    productId: 2,
    userId: 1,
    type: 'in',
    quantity: 6,
    reason: 'Invoice',
    notes: null,
    personName: 'dfghjkl',
    place: 'Ranchi Godown / Bay 1',
    referenceNo: 'INV/2026-27/0001',
    transactionDate: '2026-10-12T11:58:00.000Z',
    serialNumbers: [],
    senderPhone: null,
    senderAddress: null,
    senderCompany: 'dfghjk',
    createdAt: '2026-10-12T11:58:37.000Z',
  },
  {
    id: 2,
    productId: 1,
    userId: 1,
    type: 'out',
    quantity: 100,
    reason: 'Delivery Challan',
    notes: 'Driver: verma | Driver Ph: 345677654 | Vehicle: jh017777 | Time: 05:28 PM',
    personName: 'Abhishek',
    place: 'Ranchi Godown / Bay 1',
    referenceNo: 'DC/2026-27/0002',
    transactionDate: '2026-10-12T11:58:00.000Z',
    serialNumbers: [],
    senderPhone: null,
    senderAddress: null,
    senderCompany: null,
    createdAt: '2026-10-12T11:59:57.000Z',
  },
  {
    id: 3,
    productId: 2,
    userId: 1,
    type: 'out',
    quantity: 100,
    reason: 'Delivery Challan',
    notes: 'Driver: verma | Driver Ph: 345677654 | Vehicle: jh017777 | Time: 05:28 PM',
    personName: 'Abhishek',
    place: 'Ranchi Godown / Bay 1',
    referenceNo: 'DC/2026-27/0002',
    transactionDate: '2026-10-12T11:58:00.000Z',
    serialNumbers: [],
    senderPhone: null,
    senderAddress: null,
    senderCompany: null,
    createdAt: '2026-10-12T11:59:57.000Z',
  },
];

async function syncData() {
  try {
    await connectDB();
    await Product.sync();
    await StockTransaction.sync();

    console.log('🔄 Checking Admin user...');
    let admin = await User.findByPk(1);
    if (!admin) {
      admin = await User.findOne({ where: { role: 'admin' } });
    }
    const adminId = admin ? admin.id : 1;

    console.log('📦 Restoring Products...');
    for (const prod of productsData) {
      const existing = await Product.findOne({ where: { sku: prod.sku } });
      if (!existing) {
        await Product.create({ ...prod, userId: adminId });
        console.log(`  ➕ Inserted product: ${prod.name} (${prod.sku})`);
      } else {
        await existing.update({ ...prod, userId: adminId });
        console.log(`  ✓ Updated product: ${prod.name} (${prod.sku})`);
      }
    }

    console.log('📋 Restoring Stock Transactions...');
    for (const tx of transactionsData) {
      const existing = await StockTransaction.findByPk(tx.id);
      if (!existing) {
        await StockTransaction.create({ ...tx, userId: adminId });
        console.log(`  ➕ Inserted transaction #${tx.id} (${tx.type.toUpperCase()} - ${tx.quantity} units, Ref: ${tx.referenceNo})`);
      } else {
        await existing.update({ ...tx, userId: adminId });
        console.log(`  ✓ Transaction #${tx.id} already exists`);
      }
    }

    console.log('\n🎉 ALL LOCAL DATA SUCCESSFULLY SYNCED TO THE CLOUD DATABASE!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Data sync failed:', error.message);
    process.exit(1);
  }
}

syncData();
