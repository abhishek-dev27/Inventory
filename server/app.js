const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const stockRoutes = require('./routes/stockRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const customerRoutes = require('./routes/customerRoutes');
const accountRoutes = require('./routes/accountRoutes');
const godownRoutes = require('./routes/godownRoutes');

const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

// Import middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Trust proxy for Nginx / reverse proxy setup on GCP VM
app.set('trust proxy', 1);

// 1. Security HTTP Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing with Credentials
app.use(cors({
  origin: true,
  credentials: true,
}));

// 3. Body Parsers with Explicit 2MB Payload Limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Cookie Parser (for HttpOnly Refresh Token Cookies)
app.use(cookieParser());

// 5. HTTP Parameter Pollution (HPP) Protection
app.use(hpp());

// 6. Global API Rate Limiter (500 requests per 15 mins)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api/', apiLimiter);

// 7. Strict Auth Rate Limiter (30 login attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/refresh', authLimiter);

// 8. Load Balancer & Worker Tracking Header
app.use((req, res, next) => {
  res.setHeader('X-Served-By-Worker', `PID-${process.pid}`);
  res.setHeader('X-Load-Balanced', 'true');
  next();
});

// Comprehensive Health Check & Load Balancer Status
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    service: 'Inventory & Commercials API',
    worker: {
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      },
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/cluster/status', (req, res) => {
  const os = require('os');
  res.json({
    status: 'healthy',
    cluster: {
      isWorker: process.send ? true : false,
      workerPid: process.pid,
      cpuCores: os.cpus().length,
      platform: os.platform(),
      arch: os.arch(),
      totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMemMB: Math.round(os.freemem() / 1024 / 1024),
      loadAvg: os.loadavg(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/godowns', godownRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
