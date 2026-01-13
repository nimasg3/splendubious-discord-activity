/**
 * Room Manager
 *
 * Manages game rooms - creation, joining, leaving, and lifecycle.
 */

import {
  GameRoom,
  RoomPlayer,
  RoomStatus,
  RoomStateDTO,
  PlayerDTO,
  ConnectionStatus,
} from '../types.js';

// =============================================================================
// ROOM STORE
// =============================================================================

/** In-memory room storage */
const rooms = new Map<string, GameRoom>();

// =============================================================================
// ROOM MANAGEMENT
// =============================================================================

/**
 * Creates a new game room
 *
 * @param hostId - Player ID of the host
 * @param hostName - Display name of the host
 * @param hostSocketId - Socket ID of the host
 * @returns The created room
 */
export function createRoom(
  hostId: string,
  hostName: string,
  hostSocketId: string
): GameRoom {
  const roomId = generateRoomId();
  
  const host: RoomPlayer = {
    id: hostId,
    name: hostName,
    socketId: hostSocketId,
    status: 'connected',
    isSpectator: false,
    lastActivity: Date.now(),
  };
  
  const room: GameRoom = {
    id: roomId,
    status: 'lobby',
    hostId: hostId,
    players: [host],
    config: null,
    gameState: null,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  
  rooms.set(roomId, room);
  return room;
}

/**
 * Joins a player to an existing room
 *
 * @param roomId - Room to join
 * @param playerId - Player ID
 * @param playerName - Player display name
 * @param socketId - Player's socket ID
 * @param asSpectator - Whether joining as spectator
 * @returns Updated room or error
 */
export function joinRoom(
  roomId: string,
  playerId: string,
  playerName: string,
  socketId: string,
  asSpectator: boolean = false
): GameRoom | { error: string } {
  const room = rooms.get(roomId);
  
  if (!room) {
    return { error: 'Room not found' };
  }
  
  // Check if game already started (can only join as spectator)
  if (room.status === 'playing' && !asSpectator) {
    return { error: 'Game already in progress. You can only join as a spectator.' };
  }
  
  if (room.status === 'ended') {
    return { error: 'Game has ended' };
  }
  
  // Check if player already in room
  const existingPlayer = room.players.find(p => p.id === playerId);
  if (existingPlayer) {
    // Reconnection - update socket ID
    existingPlayer.socketId = socketId;
    existingPlayer.status = 'connected';
    existingPlayer.lastActivity = Date.now();
    room.lastActivity = Date.now();
    return room;
  }
  
  // Check player limit (max 4 non-spectator players)
  if (!asSpectator) {
    const activePlayers = room.players.filter(p => !p.isSpectator);
    if (activePlayers.length >= 4) {
      return { error: 'Room is full (max 4 players)' };
    }
  }
  
  // Add new player
  const newPlayer: RoomPlayer = {
    id: playerId,
    name: playerName,
    socketId: socketId,
    status: 'connected',
    isSpectator: asSpectator,
    lastActivity: Date.now(),
  };
  
  room.players.push(newPlayer);
  room.lastActivity = Date.now();
  
  return room;
}

/**
 * Removes a player from a room
 *
 * @param roomId - Room ID
 * @param playerId - Player to remove
 * @returns Updated room or null if room was deleted
 */
export function leaveRoom(
  roomId: string,
  playerId: string
): GameRoom | null {
  const room = rooms.get(roomId);
  
  if (!room) {
    return null;
  }
  
  // Remove player from room
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return room;
  }
  
  room.players.splice(playerIndex, 1);
  
  // If no players remain, delete room
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return null;
  }
  
  // If host left, assign new host to first non-spectator player
  if (room.hostId === playerId) {
    const newHost = room.players.find(p => !p.isSpectator);
    if (newHost) {
      room.hostId = newHost.id;
    } else {
      // Only spectators remain, delete room
      rooms.delete(roomId);
      return null;
    }
  }
  
  room.lastActivity = Date.now();
  return room;
}

/**
 * Gets a room by ID
 */
export function getRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId);
}

/**
 * Gets all rooms (for debugging/admin)
 */
export function getAllRooms(): GameRoom[] {
  return Array.from(rooms.values());
}

/**
 * Deletes a room
 */
export function deleteRoom(roomId: string): boolean {
  return rooms.delete(roomId);
}

// =============================================================================
// PLAYER MANAGEMENT
// =============================================================================

/**
 * Updates a player's connection status
 */
export function updatePlayerStatus(
  roomId: string,
  playerId: string,
  status: ConnectionStatus,
  socketId?: string
): GameRoom | undefined {
  const room = rooms.get(roomId);
  if (!room) {
    return undefined;
  }
  
  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return undefined;
  }
  
  player.status = status;
  if (socketId !== undefined) {
    player.socketId = socketId;
  }
  player.lastActivity = Date.now();
  room.lastActivity = Date.now();
  
  return room;
}

/**
 * Updates a player's display name
 */
export function updatePlayerName(
  roomId: string,
  playerId: string,
  newName: string
): GameRoom | undefined {
  const room = rooms.get(roomId);
  if (!room) {
    return undefined;
  }
  
  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return undefined;
  }
  
  player.name = newName;
  player.lastActivity = Date.now();
  room.lastActivity = Date.now();
  
  return room;
}

/**
 * Gets a player from a room
 */
export function getPlayer(
  roomId: string,
  playerId: string
): RoomPlayer | undefined {
  const room = rooms.get(roomId);
  return room?.players.find((p) => p.id === playerId);
}

/**
 * Gets the room a socket is in
 */
export function getRoomBySocketId(socketId: string): GameRoom | undefined {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.socketId === socketId)) {
      return room;
    }
  }
  return undefined;
}

/**
 * Finds player by socket ID
 */
export function getPlayerBySocketId(
  socketId: string
): { room: GameRoom; player: RoomPlayer } | undefined {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (player) {
      return { room, player };
    }
  }
  return undefined;
}

// =============================================================================
// ROOM STATE MANAGEMENT
// =============================================================================

/**
 * Updates room status
 */
export function updateRoomStatus(
  roomId: string,
  status: RoomStatus
): GameRoom | undefined {
  const room = rooms.get(roomId);
  if (!room) {
    return undefined;
  }
  
  room.status = status;
  room.lastActivity = Date.now();
  return room;
}

/**
 * Stores game state in room
 */
export function setGameState(
  roomId: string,
  gameState: GameRoom['gameState']
): GameRoom | undefined {
  const room = rooms.get(roomId);
  if (!room) {
    return undefined;
  }
  
  room.gameState = gameState;
  room.lastActivity = Date.now();
  return room;
}

// =============================================================================
// DTO CONVERSION
// =============================================================================

/**
 * Converts room to safe DTO for clients
 */
export function toRoomDTO(room: GameRoom): RoomStateDTO {
  return {
    id: room.id,
    status: room.status,
    hostId: room.hostId,
    players: room.players.map(toPlayerDTO),
    config: room.config,
  };
}

/**
 * Converts player to safe DTO
 */
export function toPlayerDTO(player: RoomPlayer): PlayerDTO {
  return {
    id: player.id,
    name: player.name,
    status: player.status,
    isSpectator: player.isSpectator,
  };
}

// =============================================================================
// ROOM CLEANUP
// =============================================================================

/**
 * Cleans up inactive rooms
 *
 * @param maxInactiveMs - Maximum inactivity time in milliseconds
 */
export function cleanupInactiveRooms(maxInactiveMs: number = 3600000): void {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActivity > maxInactiveMs) {
      console.log(`Cleaning up inactive room: ${roomId}`);
      rooms.delete(roomId);
    }
  }
}

/**
 * Generates a unique room ID
 * Format: 4 uppercase letters (e.g., "ABCD")
 */
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I and O to avoid confusion
  let roomId: string;
  
  do {
    roomId = '';
    for (let i = 0; i < 4; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(roomId)); // Ensure uniqueness
  
  return roomId;
}
