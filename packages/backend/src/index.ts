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
} from './types';
import { setupSocketHandlers } from './socket';
import { cleanupInactiveRooms } from './rooms';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PORT = process.env.PORT ?? 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const CLEANUP_INTERVAL = 60000; // 1 minute

// =============================================================================
// SERVER SETUP
// =============================================================================

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// =============================================================================
// REST ENDPOINTS
// =============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * Get server info
 */
app.get('/info', (_req, res) => {
  // TODO: Return server statistics
  res.json({
    version: '1.0.0',
    uptime: process.uptime(),
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
