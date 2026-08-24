const { connectDB } = require('./config/db');
const User = require('./models/User');

const run = async () => {
  try {
    await connectDB();
    const admin = await User.findOne({ where: { email: 'admin@inventory.com' } });
    if (admin) {
      console.log('Current Admin found:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        failedLoginAttempts: admin.failedLoginAttempts,
        lockUntil: admin.lockUntil,
      });

      const newPassword = process.env.ADMIN_PASSWORD || 'Admin@12345#';
      admin.password = newPassword;
      admin.failedLoginAttempts = 0;
      admin.lockUntil = null;
      await admin.save();
      console.log(`✅ Admin password updated to: ${newPassword}`);
    } else {
      const newPassword = process.env.ADMIN_PASSWORD || 'Admin@12345#';
      console.log(`Admin user not found. Creating admin@inventory.com with password ${newPassword}...`);
      await User.create({
        name: 'Admin Director',
        email: 'admin@inventory.com',
        password: newPassword,
        role: 'admin',
      });
      console.log(`✅ Created admin@inventory.com with password: ${newPassword}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
