# Discord Activity Implementation Guide

This document outlines the technical steps and functional implementations required to run Splendubious as a Discord Activity with automatic channel-based lobbies.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Discord Developer Portal Setup](#discord-developer-portal-setup)
3. [Frontend SDK Implementation](#frontend-sdk-implementation)
4. [Backend OAuth2 Token Exchange](#backend-oauth2-token-exchange)
5. [Channel-Based Lobby System](#channel-based-lobby-system)
6. [Activity Lifecycle Management](#activity-lifecycle-management)
7. [Deployment Considerations](#deployment-considerations)

---

## Prerequisites

### Required Dependencies

**Frontend:**
```bash
npm install @discord/embedded-app-sdk
```

**Backend:**
```bash
npm install axios  # For Discord API calls
```

### Environment Variables

**Frontend (`.env`):**
```env
VITE_DISCORD_CLIENT_ID=your_discord_client_id
```

**Backend (`.env`):**
```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

---

## Discord Developer Portal Setup

### Step 1: Create Discord Application

1. Navigate to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and name it "Splendubious"
3. Note the **Application ID** (this is your Client ID)

### Step 2: Configure OAuth2

1. Go to **OAuth2 → General**
2. Add redirect URI: `https://your-backend-url.com/api/discord/callback`
3. Note the **Client Secret**

### Step 3: Enable Activities

1. Go to **Activities → Getting Started**
2. Enable **"Activities"** for your application
3. Configure the following:
   - **Supported Platforms:** Web
   - **Default Orientation:** Landscape
   - **Activity URL (Development):** `http://localhost:5173`
   - **Activity URL (Production):** `https://your-cloudfront-url.cloudfront.net`

### Step 4: Configure URL Mappings

Under **Activities → URL Mappings**, add:

| Prefix | Target |
|--------|--------|
| `/api` | `https://your-backend-url.com` |
| `/` | `https://your-frontend-url.com` |

### Step 5: Set Required Scopes

Under **OAuth2 → General**, ensure these scopes are available:
- `identify` - Access user info
- `guilds` - Access guild info
- `guilds.members.read` - Read guild member info
- `rpc.activities.write` - Write activity data

---

## Frontend SDK Implementation

### Step 1: Initialize Discord SDK

Update `packages/frontend/src/discord/sdk.ts`:

```typescript
import { DiscordSDK, DiscordSDKMock } from '@discord/embedded-app-sdk';

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;

let discordSdk: DiscordSDK | DiscordSDKMock | null = null;
let isReady = false;
let accessToken: string | null = null;
let currentUser: DiscordUser | null = null;

/**
 * Initializes the Discord SDK
 */
export async function initializeDiscordSDK(): Promise<DiscordSDK | DiscordSDKMock> {
  if (discordSdk) {
    return discordSdk;
  }

  // Check if running inside Discord iframe
  const isEmbedded = window.self !== window.top;
  
  if (!isEmbedded) {
    // Use mock SDK for local development outside Discord
    console.log('Running outside Discord, using mock SDK');
    discordSdk = new DiscordSDKMock(DISCORD_CLIENT_ID, null, null);
    isReady = true;
    return discordSdk;
  }

  // Initialize real SDK
  discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
  
  // Wait for SDK to be ready
  await discordSdk.ready();
  
  isReady = true;
  console.log('Discord SDK initialized');
  
  return discordSdk;
}
```

### Step 2: Implement Authentication Flow

```typescript
/**
 * Authenticates with Discord OAuth2
 */
export async function authenticateWithDiscord(): Promise<{
  accessToken: string;
  user: DiscordUser;
}> {
  if (!discordSdk) {
    throw new Error('Discord SDK not initialized');
  }

  // Step 1: Authorize - opens Discord OAuth popup
  const { code } = await discordSdk.commands.authorize({
    client_id: DISCORD_CLIENT_ID,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: [
      'identify',
      'guilds',
      'guilds.members.read',
      'rpc.activities.write',
    ],
  });

  // Step 2: Exchange code for access token via backend
  const response = await fetch('/api/discord/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange token');
  }

  const { access_token } = await response.json();
  accessToken = access_token;

  // Step 3: Authenticate with the access token
  const auth = await discordSdk.commands.authenticate({ access_token });
  
  if (!auth.user) {
    throw new Error('Authentication failed');
  }

  currentUser = {
    id: auth.user.id,
    username: auth.user.username,
    discriminator: auth.user.discriminator,
    avatar: auth.user.avatar,
    globalName: auth.user.global_name,
  };

  return { accessToken: access_token, user: currentUser };
}
```

### Step 3: Implement Instance/Channel ID Retrieval

```typescript
/**
 * Gets the current activity instance ID
 * This is unique per activity launch in a channel
 */
export function getInstanceId(): string | null {
  if (!discordSdk) return null;
  return discordSdk.instanceId;
}

/**
 * Gets the channel ID where the activity is running
 */
export function getChannelId(): string | null {
  if (!discordSdk) return null;
  return discordSdk.channelId;
}

/**
 * Gets the guild ID where the activity is running
 */
export function getGuildId(): string | null {
  if (!discordSdk) return null;
  return discordSdk.guildId;
}
```

### Step 4: Implement Participant Tracking

```typescript
/**
 * Gets current activity participants
 */
export async function getParticipants(): Promise<ActivityParticipant[]> {
  if (!discordSdk) return [];

  const { participants } = await discordSdk.commands.getInstanceConnectedParticipants();
  
  return participants.map((p) => ({
    id: p.id,
    username: p.username,
    discriminator: p.discriminator,
    avatar: p.avatar,
    nickname: p.nickname,
  }));
}

/**
 * Subscribes to participant changes
 */
export function onParticipantsChange(
  callback: (participants: ActivityParticipant[]) => void
): () => void {
  if (!discordSdk) {
    return () => {};
  }

  const handler = (event: { participants: ActivityParticipant[] }) => {
    callback(event.participants);
  };

  discordSdk.subscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', handler);

  // Return unsubscribe function
  return () => {
    discordSdk?.unsubscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', handler);
  };
}
```

---

## Backend OAuth2 Token Exchange

### Step 1: Add Token Exchange Endpoint

Add to `packages/backend/src/index.ts`:

```typescript
import axios from 'axios';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

/**
 * Exchange OAuth2 code for access token
 */
app.post('/api/discord/token', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const response = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    res.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error('Token exchange failed:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});
```

---

## Channel-Based Lobby System

The core concept: **Each Discord channel where the activity is launched gets its own lobby automatically.**

### Step 1: Modify Room Manager for Channel-Based Rooms

Update `packages/backend/src/rooms/roomManager.ts`:

```typescript
/** Map of Discord channel IDs to room IDs */
const channelRoomMap = new Map<string, string>();

/**
 * Gets or creates a room for a Discord channel
 * This enables automatic lobby creation per channel
 */
export function getOrCreateChannelRoom(
  channelId: string,
  instanceId: string,
  hostId: string,
  hostName: string,
  hostSocketId: string
): GameRoom {
  // Check if room already exists for this channel
  const existingRoomId = channelRoomMap.get(channelId);
  
  if (existingRoomId) {
    const existingRoom = rooms.get(existingRoomId);
    if (existingRoom && existingRoom.status !== 'abandoned') {
      return existingRoom;
    }
  }

  // Create new room for this channel
  const room = createRoom(hostId, hostName, hostSocketId);
  
  // Store Discord-specific metadata
  room.discordChannelId = channelId;
  room.discordInstanceId = instanceId;
  
  // Map channel to room
  channelRoomMap.set(channelId, room.id);
  
  return room;
}

/**
 * Finds room by Discord channel ID
 */
export function findRoomByChannelId(channelId: string): GameRoom | null {
  const roomId = channelRoomMap.get(channelId);
  if (!roomId) return null;
  return rooms.get(roomId) ?? null;
}

/**
 * Cleans up channel-room mapping when room is destroyed
 */
export function cleanupChannelRoom(channelId: string): void {
  channelRoomMap.delete(channelId);
}
```

### Step 2: Update Room Types

Update `packages/backend/src/types.ts`:

```typescript
export interface GameRoom {
  id: string;
  status: RoomStatus;
  hostId: string;
  players: RoomPlayer[];
  config: GameConfig | null;
  gameState: GameStateDTO | null;
  createdAt: number;
  lastActivity: number;
  
  // Discord-specific fields
  discordChannelId?: string;
  discordInstanceId?: string;
  discordGuildId?: string;
}
```

### Step 3: Update Socket Handlers for Auto-Join

Update `packages/backend/src/socket/handlers.ts`:

```typescript
/**
 * Handles player joining via Discord Activity
 * Automatically creates/joins the channel's lobby
 */
socket.on('discord:joinActivity', async (data, callback) => {
  const { channelId, instanceId, guildId, userId, username } = data;

  try {
    // Get or create room for this channel
    const room = getOrCreateChannelRoom(
      channelId,
      instanceId,
      userId,
      username,
      socket.id
    );

    // If room already exists, join it
    if (room.players.find(p => p.id !== odId)) {
      const result = joinRoom(room.id, odId, username, socket.id, false);
      if ('error' in result) {
        callback({ success: false, error: result.error });
        return;
      }
    }

    // Join socket.io room
    socket.join(room.id);
    socket.data.odId = odId;
    socket.data.roomId = room.id;

    // Broadcast updated room state
    io.to(room.id).emit('room:stateUpdated', getRoomDTO(room));

    callback({
      success: true,
      room: getRoomDTO(room),
    });
  } catch (error) {
    callback({ success: false, error: 'Failed to join activity' });
  }
});
```

### Step 4: Frontend Auto-Join on Activity Start

Update the main app initialization:

```typescript
// In App.tsx or GameContext.tsx

async function initializeActivity() {
  // 1. Initialize Discord SDK
  await initializeDiscordSDK();
  
  // 2. Authenticate with Discord
  const { user } = await authenticateWithDiscord();
  
  // 3. Get channel info
  const channelId = getChannelId();
  const instanceId = getInstanceId();
  const guildId = getGuildId();
  
  if (!channelId || !instanceId) {
    throw new Error('Not running inside Discord Activity');
  }
  
  // 4. Connect to game server
  const socket = connectToServer();
  
  // 5. Auto-join the channel's lobby
  socket.emit('discord:joinActivity', {
    channelId,
    instanceId,
    guildId,
    userId: user.id,
    username: user.globalName ?? user.username,
  }, (response) => {
    if (response.success) {
      // Automatically in the lobby!
      setGameState('lobby');
      setRoom(response.room);
    } else {
      setError(response.error);
    }
  });
  
  // 6. Subscribe to participant changes
  onParticipantsChange((participants) => {
    // Sync participants with game lobby
    syncParticipantsWithLobby(participants);
  });
}
```

---

## Activity Lifecycle Management

### Handling Participant Join/Leave

```typescript
/**
 * Syncs Discord participants with game lobby
 * Called when ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE fires
 */
function syncParticipantsWithLobby(participants: ActivityParticipant[]) {
  const currentPlayerIds = new Set(room.players.map(p => p.id));
  const participantIds = new Set(participants.map(p => p.id));

  // Find new participants (joined the voice channel)
  for (const participant of participants) {
    if (!currentPlayerIds.has(participant.id)) {
      // New participant - they should auto-join when their client loads
      console.log(`New participant detected: ${participant.username}`);
    }
  }

  // Find left participants (left the voice channel)
  for (const player of room.players) {
    if (!participantIds.has(player.id)) {
      // Participant left - mark as disconnected
      socket.emit('room:playerDisconnected', { odId: player.id });
    }
  }
}
```

### Handling Activity Close

```typescript
// Listen for activity closing
window.addEventListener('beforeunload', () => {
  socket.emit('room:leave');
  socket.disconnect();
});

// Discord SDK also provides close event
discordSdk?.subscribe('ACTIVITY_CLOSE', () => {
  socket.emit('room:leave');
  socket.disconnect();
});
```

---

## Deployment Considerations

### URL Mapping Architecture

```
Discord Activity Frame
        ↓
    /.proxy/ prefix added by Discord
        ↓
    URL Mappings (configured in Developer Portal)
        ↓
    ┌─────────────────────────────────────┐
    │ /api/*  → Backend (App Runner)       │
    │ /*      → Frontend (CloudFront/S3)   │
    └─────────────────────────────────────┘
```

### CORS Configuration

Backend must accept requests from Discord's proxy:

```typescript
const corsOptions = {
  origin: [
    'https://your-cloudfront-url.cloudfront.net',
    /\.discordsays\.com$/,  // Discord's proxy domain
    /\.discord\.com$/,
  ],
  credentials: true,
};
```

### CSP Headers

Frontend must allow embedding in Discord's iframe. Add to your HTML or server config:

```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-ancestors https://discord.com https://*.discord.com https://*.discordsays.com">
```

### Production Checklist

- [ ] Discord Application created with Activities enabled
- [ ] OAuth2 redirect URIs configured
- [ ] URL Mappings configured for frontend and backend
- [ ] Environment variables set (Client ID, Client Secret)
- [ ] CORS configured for Discord domains
- [ ] CSP headers allow Discord iframe embedding
- [ ] Activity URLs set (development and production)
- [ ] Backend token exchange endpoint deployed
- [ ] Test in Discord's Activity Shelf

---

## Summary

| Component | Implementation |
|-----------|----------------|
| **SDK Init** | `DiscordSDK` instance with client ID |
| **Auth** | OAuth2 flow via `authorize()` → backend token exchange → `authenticate()` |
| **Channel Lobbies** | Map `channelId` → `roomId`, auto-create on first join |
| **Participant Sync** | Subscribe to `ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE` |
| **Auto-Join** | Emit `discord:joinActivity` with channel/instance IDs on connect |
| **Cleanup** | Handle `beforeunload` and `ACTIVITY_CLOSE` events |

This architecture ensures that:
1. Each Discord voice/text channel gets its own game lobby
2. Players automatically join the lobby when launching the activity
3. Participant changes in Discord sync with the game state
4. Multiple concurrent games can run in different channels
