/**
 * Socket Client
 *
 * Manages WebSocket connection to the game server.
 */

import { io, Socket } from 'socket.io-client';
import { PlayerAction } from '@splendubious/rules-engine';
import { RoomStateDTO, ClientGameState, PlayerDTO, ConnectionStatus } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface ClientToServerEvents {
  'room:create': (data: { playerName: string }, callback: RoomCallback) => void;
  'room:join': (
    data: { roomId: string; playerName: string; asSpectator?: boolean },
    callback: RoomCallback
  ) => void;
  'room:leave': (callback: SuccessCallback) => void;
  'room:update_name': (data: { name: string }, callback: SuccessCallback) => void;
  'room:start': (
    data: { config: { playerCount: 2 | 3 | 4 } },
    callback: SuccessCallback
  ) => void;
  'game:action': (data: { action: PlayerAction }, callback: ActionCallback) => void;
  'ping': (callback: (timestamp: number) => void) => void;
}

interface ServerToClientEvents {
  'room:updated': (room: RoomStateDTO) => void;
  'room:player_joined': (player: PlayerDTO) => void;
  'room:player_left': (playerId: string) => void;
  'room:player_status': (playerId: string, status: ConnectionStatus) => void;
  'game:started': (state: ClientGameState) => void;
  'game:state_updated': (state: ClientGameState) => void;
  'game:action_applied': (action: PlayerAction, state: ClientGameState) => void;
  'game:ended': (winners: string[]) => void;
  'error': (error: { code: string; message: string }) => void;
}

type RoomCallback = (response: {
  success: boolean;
  room?: RoomStateDTO;
  playerId?: string;
  error?: string;
}) => void;

type SuccessCallback = (response: { success: boolean; error?: string }) => void;
type ActionCallback = (response: { success: boolean; error?: string }) => void;

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// =============================================================================
// SOCKET INSTANCE
// =============================================================================

let socket: GameSocket | null = null;

// =============================================================================
// CONNECTION MANAGEMENT
// =============================================================================

/**
 * Connects to the game server
 *
 * @param serverUrl - Server URL (optional, defaults to relative)
 * @returns Socket instance
 */
export function connect(serverUrl?: string): GameSocket {
  if (socket?.connected) {
    return socket;
  }
  
  const url = serverUrl || window.location.origin;
  
  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });
  
  socket.on('connect', () => {
    console.log('Connected to server:', socket?.id);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });
  
  return socket;
}

/**
 * Disconnects from the server
 */
export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Gets the current socket instance
 */
export function getSocket(): GameSocket | null {
  return socket;
}

/**
 * Checks if connected to server
 */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}

// =============================================================================
// ROOM OPERATIONS
// =============================================================================

/**
 * Creates a new room
 */
export async function createRoom(playerName: string): Promise<{ room: RoomStateDTO; playerId: string }> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected to server'));
      return;
    }
    
    socket.emit('room:create', { playerName }, (response) => {
      if (response.success && response.room && response.playerId) {
        resolve({ room: response.room, playerId: response.playerId });
      } else {
        reject(new Error(response.error || 'Failed to create room'));
      }
    });
  });
}

/**
 * Joins an existing room
 */
export async function joinRoom(
  roomId: string,
  playerName: string,
  asSpectator: boolean = false
): Promise<{ room: RoomStateDTO; playerId: string }> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected to server'));
      return;
    }
    
    socket.emit('room:join', { roomId, playerName, asSpectator }, (response) => {
      if (response.success && response.room && response.playerId) {
        resolve({ room: response.room, playerId: response.playerId });
      } else {
        reject(new Error(response.error || 'Failed to join room'));
      }
    });
  });
}

/**
 * Leaves the current room
 */
export async function leaveRoom(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected to server'));
      return;
    }
    
    socket.emit('room:leave', (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || 'Failed to leave room'));
      }
    });
  });
}

/**
 * Updates the player's display name
 */
export async function updatePlayerName(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected to server'));
      return;
    }
    
    socket.emit('room:update_name', { name }, (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || 'Failed to update name'));
      }
    });
  });
}

/**
 * Starts the game (host only)
 */
export async function startGame(playerCount: 2 | 3 | 4): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected to server'));
      return;
    }
    
    socket.emit('room:start', { config: { playerCount } }, (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || 'Failed to start game'));
      }
    });
  });
}

// =============================================================================
// GAME OPERATIONS
// =============================================================================

/**
 * Sends a game action to the server
 */
export async function sendAction(action: PlayerAction): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected to server'));
      return;
    }
    
    socket.emit('game:action', { action }, (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || 'Action failed'));
      }
    });
  });
}

// =============================================================================
// EVENT SUBSCRIPTIONS
// =============================================================================

/**
 * Subscribes to room updates
 */
export function onRoomUpdated(callback: (room: RoomStateDTO) => void): () => void {
  if (!socket) return () => {};
  socket.on('room:updated', callback);
  return () => socket?.off('room:updated', callback);
}

/**
 * Subscribes to player join events
 */
export function onPlayerJoined(callback: (player: PlayerDTO) => void): () => void {
  if (!socket) return () => {};
  socket.on('room:player_joined', callback);
  return () => socket?.off('room:player_joined', callback);
}

/**
 * Subscribes to player leave events
 */
export function onPlayerLeft(callback: (playerId: string) => void): () => void {
  if (!socket) return () => {};
  socket.on('room:player_left', callback);
  return () => socket?.off('room:player_left', callback);
}

/**
 * Subscribes to game state updates
 */
export function onGameStateUpdated(
  callback: (state: ClientGameState) => void
): () => void {
  if (!socket) return () => {};
  socket.on('game:state_updated', callback);
  return () => socket?.off('game:state_updated', callback);
}

/**
 * Subscribes to game start events
 */
export function onGameStarted(
  callback: (state: ClientGameState) => void
): () => void {
  if (!socket) return () => {};
  socket.on('game:started', callback);
  return () => socket?.off('game:started', callback);
}

/**
 * Subscribes to game end events
 */
export function onGameEnded(callback: (winners: string[]) => void): () => void {
  if (!socket) return () => {};
  socket.on('game:ended', callback);
  return () => socket?.off('game:ended', callback);
}

/**
 * Subscribes to server errors
 */
export function onError(
  callback: (error: { code: string; message: string }) => void
): () => void {
  if (!socket) return () => {};
  socket.on('error', callback);
  return () => socket?.off('error', callback);
}

// =============================================================================
// UTILITY
// =============================================================================

/**
 * Pings the server and returns latency
 */
export async function ping(): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected to server'));
      return;
    }
    
    const start = Date.now();
    socket.emit('ping', (_serverTime) => {
      const latency = Date.now() - start;
      resolve(latency);
    });
  });
}
