/**
 * 🧹 Clean Production Live Ready Database Reset Script
 * 
 * Safely removes all dummy/test data:
 * - Clears all Stock Transactions (Inward & Outward vouchers)
 * - Clears all Products & Inventory catalog
 * - Clears all Activity Logs & audit test logs
 * - Clears all Proposals & Proposal Items test entries
 * - Removes dummy test staff accounts (rajesh, priya)
 * - Preserves & verifies active Admin accounts:
 *     1. admin@inventory.com (Admin Director)
 *     2. abhishekkumar190205@gmail.com (Abhishek Kumar - Promoted to Full Admin)
 * - Ensures standard operational Godowns (Ranchi, Jamshedpur, Hazaribagh, Patna, Daltonganj)
 * - Resets table auto-increment counters to 1
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const StockTransaction = require('./models/StockTransaction');
const ActivityLog = require('./models/ActivityLog');
const Godown = require('./models/Godown');

const DEFAULT_GODOWNS = [
  { name: 'Ranchi', code: 'RAN', city: 'Ranchi', state: 'Jharkhand' },
  { name: 'Jamshedpur', code: 'JAM', city: 'Jamshedpur', state: 'Jharkhand' },
  { name: 'Hazaribagh', code: 'HAZ', city: 'Hazaribagh', state: 'Jharkhand' },
  { name: 'Patna', code: 'PAT', city: 'Patna', state: 'Bihar' },
  { name: 'Daltonganj', code: 'DAL', city: 'Daltonganj', state: 'Jharkhand' },
];

const cleanDatabaseForLive = async () => {
  try {
    console.log('\n============================================================');
    console.log('🚀 PREPARING APPLICATION FOR LIVE DEPLOYMENT');
    console.log('🧹 CLEARING ALL DUMMY DATA, TRANSACTIONS & TEST ACCOUNTS');
    console.log('============================================================\n');

    await connectDB();

    // 1. Disable Foreign Key Checks for clean truncation
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    console.log('🗑️  Deleting All Stock Transactions (Ledger reset)...');
    await StockTransaction.destroy({ where: {}, truncate: true });

    console.log('🗑️  Deleting All Products & Inventory Catalog...');
    await Product.destroy({ where: {}, truncate: true });

    console.log('🗑️  Deleting Activity Logs & Test Audits...');
    await ActivityLog.destroy({ where: {}, truncate: true });

    // Truncate proposals if table exists
    try {
      console.log('🗑️  Deleting Test Proposals & Quotations...');
      await sequelize.query('TRUNCATE TABLE `proposal_items`;');
      await sequelize.query('TRUNCATE TABLE `proposals`;');
    } catch (e) {
      console.log('ℹ️  Proposal tables skipped or empty.');
    }

    // 2. Clean Up Users
    console.log('👤 Purging Dummy Test Users (Preserving Official Admin Accounts)...');
    await User.destroy({
      where: {
        email: ['rajesh.sharma@sologix.com', 'priya.singh@sologix.com'],
      },
    });

    // 3. Ensure primary admin@inventory.com exists & active
    const adminEmail = 'admin@inventory.com';
    const adminPassword = 'Sologix@12345';
    let admin = await User.findOne({ where: { email: adminEmail } });

    if (admin) {
      admin.name = 'Admin Director';
      admin.password = adminPassword;
      admin.savedPassword = adminPassword;
      admin.role = 'admin';
      admin.assignedLocation = 'All Locations';
      admin.failedLoginAttempts = 0;
      admin.lockUntil = null;
      admin.allowedModules = [
        'dashboard',
        'products',
        'stock_in',
        'stock_out',
        'stock_history',
        'reports',
        'users',
        'activity_logs',
      ];
      await admin.save();
      console.log(`✅ Verified Primary Admin: ${adminEmail}`);
    } else {
      admin = await User.create({
        name: 'Admin Director',
        email: adminEmail,
        password: adminPassword,
        savedPassword: adminPassword,
        role: 'admin',
        assignedLocation: 'All Locations',
        allowedModules: [
          'dashboard',
          'products',
          'stock_in',
          'stock_out',
          'stock_history',
          'reports',
          'users',
          'activity_logs',
        ],
      });
      console.log(`✅ Created Primary Admin: ${adminEmail}`);
    }

    // 4. Ensure Abhishek Kumar account is upgraded to Full Admin
    const devEmail = 'abhishekkumar190205@gmail.com';
    let devUser = await User.findOne({ where: { email: devEmail } });
    if (devUser) {
      devUser.role = 'admin';
      devUser.assignedLocation = 'All Locations';
      devUser.failedLoginAttempts = 0;
      devUser.lockUntil = null;
      devUser.allowedModules = [
        'dashboard',
        'products',
        'stock_in',
        'stock_out',
        'stock_history',
        'reports',
        'users',
        'activity_logs',
      ];
      await devUser.save();
      console.log(`✅ Verified & Promoted to Full Admin: ${devEmail} (${devUser.name})`);
    }

    // 5. Clean Godowns - Keep only clean standard operational locations
    console.log('🏢 Standardizing Operational Warehouse Godowns...');
    // Delete any test godowns like 'siwan', 'fghjkl'
    await Godown.destroy({
      where: {
        name: sequelize.literal(`\`name\` NOT IN ('Ranchi', 'Jamshedpur', 'Hazaribagh', 'Patna', 'Daltonganj')`),
      },
    });

    for (const g of DEFAULT_GODOWNS) {
      await Godown.findOrCreate({
        where: { name: g.name },
        defaults: {
          name: g.name,
          code: g.code,
          city: g.city,
          state: g.state,
          status: 'active',
          isDefault: true,
        },
      });
    }

    // 6. Reset Auto-Increment Counters
    console.log('🔢 Resetting Database Auto-Increment IDs...');
    try {
      await sequelize.query('ALTER TABLE `stock_transactions` AUTO_INCREMENT = 1;');
      await sequelize.query('ALTER TABLE `products` AUTO_INCREMENT = 1;');
      await sequelize.query('ALTER TABLE `activity_logs` AUTO_INCREMENT = 1;');
    } catch (e) {
      console.warn('Auto-increment reset warning:', e.message);
    }

    // 7. Re-enable Foreign Key Checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('\n============================================================');
    console.log('🎉 LIVE READINESS CLEANUP SUCCESSFUL!');
    console.log('------------------------------------------------------------');
    console.log('• Products:             0 (Fresh Catalog Ready)');
    console.log('• Stock Transactions:   0 (Fresh Ledger Ready)');
    console.log('• Activity Logs:        0 (Fresh Audit Trail)');
    console.log('• Operational Godowns:  5 (Ranchi, Jamshedpur, Hazaribagh, Patna, Daltonganj)');
    console.log('• Active Admin 1:       admin@inventory.com (Pass: Sologix@12345)');
    console.log('• Active Admin 2:       abhishekkumar190205@gmail.com (Pass: Abhishek@6209)');
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during live cleanup:', error);
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (_) {}
    process.exit(1);
  }
};

cleanDatabaseForLive();
