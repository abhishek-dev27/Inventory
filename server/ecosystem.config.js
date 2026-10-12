/**
 * 💼 PM2 Enterprise Production Process Manager Configuration
 * 
 * Commands for 24/7 background operation:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save                      (Persists process list across VM reboots)
 *   pm2 startup                   (Generates system boot service)
 *   pm2 reload all                (Zero-downtime hot reload)
 *   pm2 status                    (Check running status)
 *   pm2 logs                      (Stream live logs)
 */

module.exports = {
  apps: [
    {
      name: 'inventory-system',
      script: './server.js',
      instances: 'max',            // Automatically uses all CPU cores
      exec_mode: 'cluster',
      autorestart: true,           // Auto-restarts immediately if crashed
      watch: false,                // Disabled in production to prevent unexpected reloads
      max_memory_restart: '1G',    // Auto-restart if memory leaks exceed 1GB
      restart_delay: 2000,         // Wait 2s before restarting to prevent rapid thrashing
      min_uptime: '5s',            // Considered stable if running for at least 5s
      max_restarts: 30,            // Up to 30 restart attempts
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      wait_ready: true,            // Waits for process.send('ready') from server.js
      listen_timeout: 10000,       // 10 second timeout for startup
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
