/**
 * Splendubious Backend Server
 *
 * Main entry point for the game server.
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './types.js';
import { setupSocketHandlers } from './socket/index.js';
import { cleanupInactiveRooms } from './rooms/index.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PORT = process.env.PORT ?? 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const CLEANUP_INTERVAL = 60000; // 1 minute

console.log('Starting server with config:', { PORT, CORS_ORIGIN });

// =============================================================================
// SERVER SETUP
// =============================================================================

const app = express();
const httpServer = createServer(app);

// CORS configuration - allow all origins if * is set
const corsOptions = {
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true,
};

console.log('CORS options:', corsOptions);

// Configure Socket.IO
// Note: App Runner doesn't support WebSockets, so we use polling only
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: corsOptions,
  transports: ['polling'],
  allowEIO3: true,
});

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(cors(corsOptions));
app.use(express.json());

// =============================================================================
// REST ENDPOINTS
// =============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), cors: CORS_ORIGIN });
});

/**
 * Get server info
 */
app.get('/info', (_req, res) => {
  // TODO: Return server statistics
  res.json({
    version: '1.0.0',
    uptime: process.uptime(),
    cors: CORS_ORIGIN,
    // activeRooms: getAllRooms().length,
    // activePlayers: ...
  });
});

// =============================================================================
// SOCKET HANDLERS
// =============================================================================

setupSocketHandlers(io);

// =============================================================================
// PERIODIC TASKS
// =============================================================================

// Cleanup inactive rooms periodically
setInterval(() => {
  cleanupInactiveRooms();
}, CLEANUP_INTERVAL);

// =============================================================================
// SERVER START
// =============================================================================

httpServer.listen(PORT, () => {
  console.log(`🎮 Splendubious server running on port ${PORT}`);
  console.log(`   CORS origin: ${CORS_ORIGIN}`);
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  io.close(() => {
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

export { app, io, httpServer };
