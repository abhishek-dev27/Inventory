const { sequelize } = require('./config/db');

async function viewDatabase() {
  try {
    await sequelize.authenticate();
    console.log('\n======================================================');
    console.log('       🟢 LIVE MYSQL DATABASE: inventory_db');
    console.log('======================================================\n');

    // 1. Products
    const [products] = await sequelize.query(`
      SELECT id, sku, name, productType, brand, capacity, quantity, CONCAT('₹', price) AS price, location
      FROM products
      ORDER BY id ASC;
    `);
    console.log(`📦 PRODUCTS TABLE (${products.length} Items):`);
    console.table(products);

    // 2. Stock Transactions
    const [transactions] = await sequelize.query(`
      SELECT id, type, quantity, personName, place, reason, DATE_FORMAT(transactionDate, '%Y-%m-%d %H:%i') AS date
      FROM stock_transactions
      ORDER BY id DESC
      LIMIT 10;
    `);
    console.log(`\n📋 STOCK TRANSACTIONS / MOVEMENTS (${transactions.length} Latest Entries):`);
    console.table(transactions);

    // 3. Activity & Login Logs
    const [logs] = await sequelize.query(`
      SELECT id, action, userEmail, ipAddress, location, status, DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') AS timestamp
      FROM activity_logs
      ORDER BY id DESC
      LIMIT 10;
    `);
    console.log(`\n🛡️ ACTIVITY & LOGIN AUDIT LOGS (${logs.length} Latest Logs):`);
    console.table(logs);

    // 4. Users
    const [users] = await sequelize.query(`
      SELECT id, name, email, role, DATE_FORMAT(createdAt, '%Y-%m-%d') AS created
      FROM users;
    `);
    console.log(`\n👤 REGISTERED USERS (${users.length} Users):`);
    console.table(users);

    console.log('\n✅ All records above are verified and live in your MySQL Server!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error connecting to MySQL:', error.message);
    process.exit(1);
  }
}

viewDatabase();
