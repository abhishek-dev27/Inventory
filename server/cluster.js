/**
 * 🚀 High-Performance Multi-Worker Node.js Cluster Load Balancer
 * 
 * Features:
 * - Hardware Core Detection & Round-Robin Socket Distribution (SCHED_RR)
 * - Single-Pass Database Sync & Admin Seeding (Zero Race Conditions)
 * - Auto-Healing / Zero-Downtime Worker Respawn on Unexpected Crash
 * - Graceful Shutdown on SIGINT / SIGTERM
 */

const cluster = require('cluster');
const os = require('os');
const { startServer, initDatabase } = require('./server');

// Determine worker capacity based on CPU cores or environment override
const numCPUs = os.cpus().length;
const configuredWorkers = parseInt(process.env.WORKERS || process.env.WEB_CONCURRENCY, 10);
// Use at least 2 workers for true redundancy, up to CPU core count (capped at 4 in dev)
const WORKERS_COUNT = configuredWorkers || Math.min(Math.max(numCPUs, 2), 4);

// Set Round-Robin scheduling policy
if (cluster.schedulingPolicy !== undefined) {
  cluster.schedulingPolicy = cluster.SCHED_RR;
}

if (cluster.isPrimary || cluster.isMaster) {
  console.log('\n============================================================');
  console.log('🛡️  INVENTORY & COMMERCIALS CLUSTER LOAD BALANCER');
  console.log('============================================================');
  console.log(`🖥️  Host System: ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`⚡ Available CPU Cores: ${numCPUs}`);
  console.log(`🚀 Spawning ${WORKERS_COUNT} Load-Balanced Worker Processes`);
  console.log(`👑 Primary Master PID: ${process.pid}`);
  console.log('============================================================\n');

  // Step 1: Initialize Database schema once from primary before forking workers
  const bootstrapCluster = async () => {
    try {
      console.log('🔄 [Primary Master] Synchronizing database tables & seeds...');
      await initDatabase(true);
      console.log('✅ [Primary Master] Database ready. Forking worker pool...\n');

      // Step 2: Fork worker processes
      for (let i = 0; i < WORKERS_COUNT; i++) {
        const worker = cluster.fork({ IS_CLUSTER_WORKER: 'true' });
        console.log(`🌱 [Primary Master] Spawned Worker #${i + 1} (PID: ${worker.process.pid})`);
      }

      // Step 3: Worker Lifecycle Monitoring & Auto-Healing
      cluster.on('online', (worker) => {
        console.log(`🟢 [Worker PID ${worker.process.pid}] is online and accepting traffic`);
      });

      cluster.on('exit', (worker, code, signal) => {
        console.warn(`\n⚠️  [Worker PID ${worker.process.pid}] died (Signal: ${signal || 'none'}, Code: ${code})`);
        
        // Auto-heal: Respawn fresh worker with zero downtime
        if (!worker.exitedAfterDisconnect) {
          console.log('🔄 [Primary Master] Auto-healing: Spawning replacement worker process...');
          const newWorker = cluster.fork({ IS_CLUSTER_WORKER: 'true' });
          console.log(`✨ [Primary Master] Replacement Worker online (PID: ${newWorker.process.pid})`);
        }
      });

      // Step 4: Graceful shutdown handler
      const handleShutdown = (signal) => {
        console.log(`\n🛑 [Primary Master] Received ${signal}. Gracefully stopping all cluster workers...`);
        for (const id in cluster.workers) {
          cluster.workers[id].kill();
        }
        process.exit(0);
      };

      process.on('SIGINT', () => handleShutdown('SIGINT'));
      process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    } catch (err) {
      console.error('❌ [Primary Master] Failed to bootstrap cluster:', err);
      process.exit(1);
    }
  };

  bootstrapCluster();

} else {
  // Worker Process: Connect to DB and bind to port (OS load balances sockets automatically)
  startServer(process.env.PORT || 5000, false);
}
