import 'dotenv/config';
import { createServer } from 'node:http';
import { setupListeners } from './listeners';

// Simple in-memory health status (will turn unhealthy if DB fails, etc.)
let isHealthy = true;
let lastError: string | null = null;

// Health check endpoint
const server = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/healthz') {
    if (isHealthy) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
      );
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'error',
          error: lastError,
          timestamp: new Date().toISOString(),
        })
      );
    }
    return;
  }

  // Optional: simple root page
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('CloakX Relay Engine is running\n');
    return;
  }

  res.writeHead(404);
  res.end();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received — shutting down');
  server.close(() => process.exit(0));
});

// Start everything
(async () => {
  console.log('CloakX Relay Engine Started');

  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`Health check available at http://localhost:${PORT}/health`);
    console.log(`Visit http://localhost:${PORT} for status`);
  });

  try {
    await setupListeners();

    // Optional: mark unhealthy if listeners fail to start
    // (you can enhance this later with DB ping, Sui connection check, etc.)
    isHealthy = true;
  } catch (err) {
    console.error('Failed to start listeners:', err);
    isHealthy = false;
    lastError = err instanceof Error ? err.message : String(err);
  }
})();