/**
 * 🌐 Standalone Layer-7 HTTP Reverse Proxy Load Balancer
 * 
 * Routes incoming client traffic across multiple independent server targets
 * with Round-Robin distribution, active health-checking, and automatic failover.
 */

const http = require('http');
const httpProxy = require('http'); // using native http forwarding

const LB_PORT = process.env.LB_PORT || 8080;

// Configurable backend instances pool
const DEFAULT_TARGETS = [
  { host: '127.0.0.1', port: 5001, alive: true, requests: 0, failedChecks: 0 },
  { host: '127.0.0.1', port: 5002, alive: true, requests: 0, failedChecks: 0 },
  { host: '127.0.0.1', port: 5003, alive: true, requests: 0, failedChecks: 0 },
];

const targets = (process.env.BACKEND_SERVERS
  ? process.env.BACKEND_SERVERS.split(',').map((url) => {
      const parsed = new URL(url.trim());
      return { host: parsed.hostname, port: parseInt(parsed.port, 10), alive: true, requests: 0, failedChecks: 0 };
    })
  : DEFAULT_TARGETS
);

let currentIndex = 0;

// Round-Robin target selector (skipping unhealthy targets)
const getNextTarget = () => {
  const healthyTargets = targets.filter(t => t.alive);
  if (healthyTargets.length === 0) {
    return null;
  }
  const target = healthyTargets[currentIndex % healthyTargets.length];
  currentIndex = (currentIndex + 1) % healthyTargets.length;
  target.requests += 1;
  return target;
};

// Periodic Background Health Checks
const runHealthChecks = () => {
  targets.forEach((target) => {
    const req = http.request(
      {
        host: target.host,
        port: target.port,
        path: '/api/health',
        method: 'GET',
        timeout: 2000,
      },
      (res) => {
        if (res.statusCode === 200) {
          if (!target.alive) {
            console.log(`🟢 [Load Balancer] Target ${target.host}:${target.port} is back HEALTHY`);
          }
          target.alive = true;
          target.failedChecks = 0;
        } else {
          target.failedChecks += 1;
          if (target.failedChecks >= 3 && target.alive) {
            console.warn(`🔴 [Load Balancer] Target ${target.host}:${target.port} marked DOWN (Status: ${res.statusCode})`);
            target.alive = false;
          }
        }
      }
    );

    req.on('error', () => {
      target.failedChecks += 1;
      if (target.failedChecks >= 3 && target.alive) {
        console.warn(`🔴 [Load Balancer] Target ${target.host}:${target.port} UNREACHABLE - Marked DOWN`);
        target.alive = false;
      }
    });

    req.on('timeout', () => {
      req.destroy();
      target.failedChecks += 1;
    });

    req.end();
  });
};

// Check health every 5 seconds
setInterval(runHealthChecks, 5000);

// Create Reverse Proxy Server
const server = http.createServer((req, res) => {
  // Load Balancer Internal Metrics Route
  if (req.url === '/lb-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'active',
      algorithm: 'Round-Robin with Active Health-Checks',
      uptimeSeconds: Math.floor(process.uptime()),
      targets: targets.map(t => ({
        target: `${t.host}:${t.port}`,
        alive: t.alive,
        totalRequestsRouted: t.requests,
        failedHealthChecks: t.failedChecks,
      })),
      timestamp: new Date().toISOString(),
    }, null, 2));
  }

  const target = getNextTarget();

  if (!target) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: '503 Service Unavailable',
      message: 'All backend server targets are currently down or undergoing maintenance.',
    }));
  }

  // Forward request to selected backend target
  const proxyReq = http.request(
    {
      host: target.host,
      port: target.port,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        'x-forwarded-for': req.socket.remoteAddress,
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'http',
        'x-forwarded-host': req.headers.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'X-Proxied-By': 'Custom-Node-LoadBalancer',
        'X-Target-Backend': `${target.host}:${target.port}`,
      });
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`❌ [Load Balancer] Proxy forwarding error to ${target.host}:${target.port}:`, err.message);
    target.alive = false;
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '502 Bad Gateway', message: 'Failed to communicate with upstream server.' }));
  });

  req.pipe(proxyReq);
});

server.listen(LB_PORT, () => {
  console.log('\n============================================================');
  console.log(`🌐 HTTP Reverse Proxy Load Balancer listening on port ${LB_PORT}`);
  console.log(`📊 Health metrics status available at http://localhost:${LB_PORT}/lb-status`);
  console.log(`🎯 Upstream Backend Pool:`, targets.map(t => `${t.host}:${t.port}`).join(', '));
  console.log('============================================================\n');
});
