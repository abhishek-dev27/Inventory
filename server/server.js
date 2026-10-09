const app = require('./app');
const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const StockTransaction = require('./models/StockTransaction');
const ActivityLog = require('./models/ActivityLog');
const Customer = require('./models/Customer');
const Account = require('./models/Account');

// Define model associations
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

User.hasMany(StockTransaction, { foreignKey: 'userId', as: 'transactions' });
StockTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Product.hasMany(StockTransaction, { foreignKey: 'productId', as: 'stockTransactions' });
StockTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Customer, { foreignKey: 'userId', as: 'customers' });
Customer.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
Account.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

Customer.hasOne(Account, { foreignKey: 'customerId', as: 'account' });
Account.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 5000;

// Auto-build frontend client if dist/ folder is missing
const ensureClientBuild = async () => {
  const clientDir = path.join(__dirname, '../client');
  const distDir = path.join(clientDir, 'dist');

  if (fs.existsSync(distDir)) {
    console.log('✅ Frontend client build found (client/dist/)');
    return;
  }

  // Only attempt auto-build on the primary worker (PID check avoids duplicate builds in cluster mode)
  const isClusterWorker = process.env.IS_CLUSTER_WORKER === 'true' || Boolean(process.send);
  if (isClusterWorker) {
    console.log('⏭️  Skipping auto-build (cluster worker — primary will handle it)');
    return;
  }

  if (!fs.existsSync(path.join(clientDir, 'package.json'))) {
    console.warn('⚠️  client/package.json not found — skipping auto-build');
    return;
  }

  console.log('🔨 Frontend build not found. Auto-building client...');
  try {
    execSync('npm install && npm run build', {
      cwd: clientDir,
      stdio: 'inherit',
      timeout: 120000, // 2 minute timeout
    });
    console.log('✅ Frontend auto-build complete → client/dist/');
  } catch (buildError) {
    console.error('⚠️  Auto-build failed (server will still start, but frontend will be unavailable):', buildError.message);
  }
};

// Initialize database, sync tables, and seed default admin
const initDatabase = async (syncTables = true) => {
  await connectDB();

  if (syncTables) {
    try {
      await sequelize.query('ALTER TABLE `users` ADD COLUMN `savedPassword` VARCHAR(255) NULL;');
    } catch (e) {
      // column may already exist
    }
    try {
      await sequelize.query('ALTER TABLE `users` ADD COLUMN `passwordHistory` JSON NULL;');
    } catch (e) {
      // column may already exist
    }

    await sequelize.sync();
    console.log('📦 Database tables synced successfully');

    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      await User.create({
        name: 'Admin',
        email: 'admin@inventory.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('👤 Default admin user created (admin@inventory.com / admin123)');
    }
  }
};

// Start Express HTTP Server
const startServer = async (port = PORT, shouldInitDb = true) => {
  try {
    if (shouldInitDb) {
      await initDatabase(true);
    } else {
      await connectDB();
    }

    // Auto-build frontend client if dist/ is missing (production safety net)
    await ensureClientBuild();

    const server = app.listen(port, () => {
      const isWorker = process.env.IS_CLUSTER_WORKER === 'true' || Boolean(process.send);
      if (isWorker) {
        console.log(`⚡ [Worker PID ${process.pid}] Active & Load-Balanced on port ${port}`);
      } else {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port} (PID: ${process.pid})`);
      }
    });

    return server;
  } catch (error) {
    console.error(`❌ [PID ${process.pid}] Failed to start server:`, error);
    process.exit(1);
  }
};

// Run directly if invoked from command line
if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
  initDatabase,
};
