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

// CORS configuration — allows configured origin(s) plus Discord's proxy domains
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow server-to-server (no origin header) and explicit wildcard config
    if (!origin || CORS_ORIGIN === '*') {
      callback(null, true);
      return;
    }
    const configured = CORS_ORIGIN.split(',').map((o) => o.trim());
    const isConfigured = configured.includes(origin);
    const isDiscord =
      /\.discordsays\.com$/.test(origin) || /\.discord\.com$/.test(origin);
    callback(null, isConfigured || isDiscord);
  },
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
 * Discord OAuth2 token exchange
 * Receives the OAuth2 authorization code from the frontend and exchanges it
 * for an access token via Discord's API.
 */
app.post('/discord/token', async (req, res) => {
  const { code } = req.body as { code?: unknown };

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not configured');
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
    });

    const discordRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error('Discord token exchange failed:', errText);
      res.status(502).json({ error: 'Token exchange failed' });
      return;
    }

    const data = await discordRes.json() as { access_token: string };
    res.json({ access_token: data.access_token });
  } catch (err) {
    console.error('Token exchange error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
