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

const PORT = process.env.PORT || 5000;

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
