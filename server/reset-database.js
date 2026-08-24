/**
 * 🧹 Clean Database Reset Script
 * 
 * Safely removes all dummy/test data:
 * - Clears all Stock Transactions
 * - Clears all Products & Inventory
 * - Clears all Customers & BD Leads
 * - Clears all Accounts & Ledger Entries
 * - Clears all Activity Logs
 * - Ensures a clean Admin account exists for login
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const StockTransaction = require('./models/StockTransaction');
const Customer = require('./models/Customer');
const Account = require('./models/Account');
const ActivityLog = require('./models/ActivityLog');

const cleanDatabase = async () => {
  try {
    console.log('\n============================================================');
    console.log('🧹 CLEARING ALL DUMMY DATA & STOCK FROM DATABASE');
    console.log('============================================================\n');

    await connectDB();

    // 1. Disable Foreign Key Checks for clean truncation
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    console.log('🗑️  Deleting Stock Transactions...');
    await StockTransaction.destroy({ where: {}, truncate: true, cascade: true });

    console.log('🗑️  Deleting All Products & Inventory Stock...');
    await Product.destroy({ where: {}, truncate: true, cascade: true });

    console.log('🗑️  Deleting Customers & BD Leads...');
    await Customer.destroy({ where: {}, truncate: true, cascade: true });

    console.log('🗑️  Deleting Accounts & Financial Records...');
    await Account.destroy({ where: {}, truncate: true, cascade: true });

    console.log('🗑️  Deleting Activity Logs...');
    await ActivityLog.destroy({ where: {}, truncate: true, cascade: true });

    // 2. Remove all non-admin staff users if any
    console.log('👤 Cleaning Users (Preserving Main Admin)...');
    await User.destroy({ where: { role: 'staff' } });

    // 3. Ensure a clean primary Admin user exists
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345#';
    let admin = await User.findOne({ where: { email: 'admin@inventory.com' } });

    if (admin) {
      admin.password = adminPassword;
      admin.failedLoginAttempts = 0;
      admin.lockUntil = null;
      await admin.save();
      console.log(`✅ Main Admin Account verified (admin@inventory.com)`);
    } else {
      admin = await User.create({
        name: 'Admin Director',
        email: 'admin@inventory.com',
        password: adminPassword,
        role: 'admin',
      });
      console.log(`✅ Created Primary Admin (admin@inventory.com / ${adminPassword})`);
    }

    // 4. Re-enable Foreign Key Checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('\n============================================================');
    console.log('✨ DATABASE CLEANUP COMPLETE!');
    console.log('------------------------------------------------------------');
    console.log('• Products: 0 (All stock cleared)');
    console.log('• Transactions: 0 (Ledger reset)');
    console.log('• Customers: 0');
    console.log('• Accounts: 0');
    console.log(`• Admin Login: admin@inventory.com`);
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (_) {}
    process.exit(1);
  }
};

cleanDatabase();
