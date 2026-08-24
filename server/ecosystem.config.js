/**
 * 💼 PM2 Enterprise Cluster Configuration
 * 
 * Run with:
 *   pm2 start ecosystem.config.js
 *   pm2 reload all --update-env (Zero-downtime hot reload)
 *   pm2 monit (Real-time cluster dashboard)
 */

module.exports = {
  apps: [
    {
      name: 'inventory-api-cluster',
      script: './server.js',
      instances: 'max', // Spawns 1 worker per CPU core
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      exp_backoff_restart_delay: 100,
      kill_timeout: 4000,
      wait_ready: true,
      listen_timeout: 8000,
    },
  ],
};
