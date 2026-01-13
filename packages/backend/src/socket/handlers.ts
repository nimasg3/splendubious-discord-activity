/**
 * Socket Event Handlers
 *
 * Handles all WebSocket events for real-time game communication.
 */

import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../types.js';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  updatePlayerStatus,
  updatePlayerName,
  toRoomDTO,
} from '../rooms/index.js';
import {
  startGame,
  processAction,
  toClientGameState,
  getGameState,
} from '../game/index.js';

type GameSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// =============================================================================
// SOCKET HANDLER SETUP
// =============================================================================

/**
 * Sets up all socket event handlers
 */
export function setupSocketHandlers(io: GameServer): void {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Set up individual handlers
    handleRoomEvents(socket, io);
    handleGameEvents(socket, io);
    handleDisconnect(socket, io);
    handlePing(socket);
  });
}

// =============================================================================
// ROOM EVENT HANDLERS
// =============================================================================

function handleRoomEvents(socket: GameSocket, io: GameServer): void {
  // Create room
  socket.on('room:create', (data, callback) => {
    const playerId = socket.data.playerId || generatePlayerId();
    const room = createRoom(playerId, data.playerName, socket.id);
    
    // Store player info in socket data
    socket.data.playerId = playerId;
    socket.data.playerName = data.playerName;
    socket.data.roomId = room.id;
    
    // Join socket to room channel
    socket.join(room.id);
    
    callback({ success: true, room: toRoomDTO(room), playerId });
  });

  // Join room
  socket.on('room:join', (data, callback) => {
    const playerId = socket.data.playerId || generatePlayerId();
    const result = joinRoom(
      data.roomId,
      playerId,
      data.playerName,
      socket.id,
      data.asSpectator ?? false
    );
    
    if ('error' in result) {
      callback({ success: false, error: result.error });
      return;
    }
    
    // Store player info in socket data
    socket.data.playerId = playerId;
    socket.data.playerName = data.playerName;
    socket.data.roomId = data.roomId;
    
    // Join socket to room channel
    socket.join(data.roomId);
    
    // Broadcast player joined to room (both individual event and full room update)
    const player = result.players.find(p => p.id === playerId);
    if (player) {
      socket.to(data.roomId).emit('room:player_joined', {
        id: player.id,
        name: player.name,
        status: player.status,
        isSpectator: player.isSpectator,
      });
      // Also broadcast full room state so host's lobby updates
      socket.to(data.roomId).emit('room:updated', toRoomDTO(result));
    }
    
    callback({ success: true, room: toRoomDTO(result), playerId });
    
    // If game is in progress, send current game state to joining player
    const gameState = getGameState(data.roomId);
    if (gameState) {
      const clientState = toClientGameState(gameState, playerId);
      socket.emit('game:state_updated', clientState);
    }
  });

  // Leave room
  socket.on('room:leave', (callback) => {
    const { roomId, playerId } = socket.data;
    
    if (!roomId || !playerId) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }
    
    const room = leaveRoom(roomId, playerId);
    
    // Leave socket room channel
    socket.leave(roomId);
    
    // Broadcast player left to room
    if (room) {
      socket.to(roomId).emit('room:player_left', playerId);
      socket.to(roomId).emit('room:updated', toRoomDTO(room));
    }
    
    // Clear socket data
    socket.data.roomId = null;
    
    callback({ success: true });
  });

  // Update player name
  socket.on('room:update_name', (data, callback) => {
    const { roomId, playerId } = socket.data;
    
    if (!roomId || !playerId) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }
    
    const room = updatePlayerName(roomId, playerId, data.name);
    
    if (!room) {
      callback({ success: false, error: 'Failed to update name' });
      return;
    }
    
    // Update socket data
    socket.data.playerName = data.name;
    
    // Broadcast updated room to all players in the room (including sender)
    io.to(roomId).emit('room:updated', toRoomDTO(room));
    
    callback({ success: true });
  });

  // Start game
  socket.on('room:start', (data, callback) => {
    const { roomId, playerId } = socket.data;
    
    if (!roomId || !playerId) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }
    
    // Verify socket is host
    const room = getRoom(roomId);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    if (room.hostId !== playerId) {
      callback({ success: false, error: 'Only the host can start the game' });
      return;
    }
    
    // Start game using game controller
    const result = startGame(roomId, data.config);
    
    if (!result.success) {
      callback({ success: false, error: result.error });
      return;
    }
    
    callback({ success: true });
    
    // Broadcast game started to all players with personalized state
    broadcastGameStarted(io, roomId);
  });
}

// =============================================================================
// GAME EVENT HANDLERS
// =============================================================================

function handleGameEvents(socket: GameSocket, io: GameServer): void {
  socket.on('game:action', (data, callback) => {
    const { roomId, playerId } = socket.data;
    
    if (!roomId || !playerId) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }
    
    // Process action using game controller
    const result = processAction(roomId, playerId, data.action);
    
    if (!result.success) {
      callback({ success: false, error: result.error });
      return;
    }
    
    callback({ success: true });
    
    // Broadcast action and state update to room
    broadcastGameState(io, roomId);
    
    // Check for game end
    if (result.state.phase === 'ended') {
      io.to(roomId).emit('game:ended', result.state.winners);
    }
  });
}

// =============================================================================
// DISCONNECT HANDLING
// =============================================================================

function handleDisconnect(socket: GameSocket, _io: GameServer): void {
  socket.on('disconnect', () => {
    const { roomId, playerId } = socket.data;
    
    console.log(`Client disconnected: ${socket.id}`);
    
    if (roomId && playerId) {
      // Update player status to disconnected
      const room = updatePlayerStatus(roomId, playerId, 'disconnected', undefined);
      
      if (room) {
        // Broadcast status change to room
        socket.to(roomId).emit('room:player_status', playerId, 'disconnected');
      }
    }
  });
}

// =============================================================================
// UTILITY HANDLERS
// =============================================================================

function handlePing(socket: GameSocket): void {
  socket.on('ping', (callback) => {
    callback(Date.now());
  });
}

// =============================================================================
// BROADCAST HELPERS
// =============================================================================

/**
 * Broadcasts room update to all players in room
 */
export function broadcastRoomUpdate(io: GameServer, roomId: string): void {
  const room = getRoom(roomId);
  if (!room) return;
  
  io.to(roomId).emit('room:updated', toRoomDTO(room));
}

/**
 * Broadcasts game started event to all players, with personalized views
 */
export function broadcastGameStarted(io: GameServer, roomId: string): void {
  const room = getRoom(roomId);
  if (!room?.gameState) return;
  
  // For each connected player, create personalized state and send game:started
  for (const player of room.players) {
    if (player.socketId && player.status === 'connected') {
      const clientState = toClientGameState(room.gameState, player.id);
      io.to(player.socketId).emit('game:started', clientState);
    }
  }
}

/**
 * Broadcasts game state to all players, with personalized views
 */
export function broadcastGameState(io: GameServer, roomId: string): void {
  const room = getRoom(roomId);
  if (!room?.gameState) return;
  
  // For each connected player, create personalized state and send
  for (const player of room.players) {
    if (player.socketId && player.status === 'connected') {
      const clientState = toClientGameState(room.gameState, player.id);
      io.to(player.socketId).emit('game:state_updated', clientState);
    }
  }
}

/**
 * Sends personalized game state to a specific player
 */
export function sendGameStateToPlayer(
  io: GameServer,
  roomId: string,
  playerId: string,
  socketId: string
): void {
  const gameState = getGameState(roomId);
  if (!gameState) return;
  
  const clientState = toClientGameState(gameState, playerId);
  io.to(socketId).emit('game:state_updated', clientState);
}

/**
 * Generates a unique player ID
 */
function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
