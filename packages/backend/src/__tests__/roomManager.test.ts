/**
 * Room Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getAllRooms,
  deleteRoom,
  updatePlayerStatus,
  getPlayer,
  getRoomBySocketId,
  getPlayerBySocketId,
  updateRoomStatus,
  setGameState,
  cleanupInactiveRooms,
} from '../rooms';

describe('Room Manager', () => {
  // Clean up rooms before and after each test
  beforeEach(() => {
    const rooms = getAllRooms();
    rooms.forEach(room => deleteRoom(room.id));
  });

  afterEach(() => {
    const rooms = getAllRooms();
    rooms.forEach(room => deleteRoom(room.id));
  });

  describe('createRoom', () => {
    it('should create a new room with the host as the first player', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');

      expect(room).toBeDefined();
      expect(room.id).toHaveLength(4);
      expect(room.status).toBe('lobby');
      expect(room.hostId).toBe('host-123');
      expect(room.players).toHaveLength(1);
      expect(room.players[0]).toEqual({
        id: 'host-123',
        name: 'HostPlayer',
        socketId: 'socket-123',
        status: 'connected',
        isSpectator: false,
        lastActivity: expect.any(Number),
      });
      expect(room.gameState).toBeNull();
      expect(room.config).toBeNull();
    });

    it('should generate unique room IDs', () => {
      const room1 = createRoom('host-1', 'Host1', 'socket-1');
      const room2 = createRoom('host-2', 'Host2', 'socket-2');

      expect(room1.id).not.toBe(room2.id);
    });

    it('should store the room in the room map', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');

      const retrieved = getRoom(room.id);
      expect(retrieved).toBe(room);
    });
  });

  describe('joinRoom', () => {
    let room: ReturnType<typeof createRoom>;

    beforeEach(() => {
      room = createRoom('host-123', 'HostPlayer', 'socket-123');
    });

    it('should add a new player to the room', () => {
      const result = joinRoom(room.id, 'player-2', 'Player2', 'socket-2');

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.players).toHaveLength(2);
        expect(result.players[1]).toEqual({
          id: 'player-2',
          name: 'Player2',
          socketId: 'socket-2',
          status: 'connected',
          isSpectator: false,
          lastActivity: expect.any(Number),
        });
      }
    });

    it('should return error for non-existent room', () => {
      const result = joinRoom('XXXX', 'player-2', 'Player2', 'socket-2');

      expect(result).toEqual({ error: 'Room not found' });
    });

    it('should allow rejoining (reconnection)', () => {
      joinRoom(room.id, 'player-2', 'Player2', 'socket-2');
      const result = joinRoom(room.id, 'player-2', 'Player2', 'socket-new');

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.players).toHaveLength(2);
        expect(result.players[1].socketId).toBe('socket-new');
        expect(result.players[1].status).toBe('connected');
      }
    });

    it('should not allow more than 4 non-spectator players', () => {
      joinRoom(room.id, 'p2', 'P2', 's2');
      joinRoom(room.id, 'p3', 'P3', 's3');
      joinRoom(room.id, 'p4', 'P4', 's4');
      const result = joinRoom(room.id, 'p5', 'P5', 's5');

      expect(result).toEqual({ error: 'Room is full (max 4 players)' });
    });

    it('should allow spectators to join a full room', () => {
      joinRoom(room.id, 'p2', 'P2', 's2');
      joinRoom(room.id, 'p3', 'P3', 's3');
      joinRoom(room.id, 'p4', 'P4', 's4');
      const result = joinRoom(room.id, 'spectator-1', 'Spectator', 's5', true);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.players).toHaveLength(5);
        expect(result.players[4].isSpectator).toBe(true);
      }
    });

    it('should not allow joining an ended game', () => {
      updateRoomStatus(room.id, 'ended');
      const result = joinRoom(room.id, 'p2', 'P2', 's2');

      expect(result).toEqual({ error: 'Game has ended' });
    });

    it('should not allow joining as player if game is in progress', () => {
      updateRoomStatus(room.id, 'playing');
      const result = joinRoom(room.id, 'p2', 'P2', 's2');

      expect(result).toEqual({ error: 'Game already in progress. You can only join as a spectator.' });
    });

    it('should allow joining as spectator if game is in progress', () => {
      updateRoomStatus(room.id, 'playing');
      const result = joinRoom(room.id, 'p2', 'P2', 's2', true);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.players[1].isSpectator).toBe(true);
      }
    });
  });

  describe('leaveRoom', () => {
    let room: ReturnType<typeof createRoom>;

    beforeEach(() => {
      room = createRoom('host-123', 'HostPlayer', 'socket-123');
      joinRoom(room.id, 'p2', 'P2', 's2');
    });

    it('should remove a player from the room', () => {
      const result = leaveRoom(room.id, 'p2');

      expect(result).not.toBeNull();
      expect(result?.players).toHaveLength(1);
      expect(result?.players[0].id).toBe('host-123');
    });

    it('should delete room when last player leaves', () => {
      leaveRoom(room.id, 'p2');
      const result = leaveRoom(room.id, 'host-123');

      expect(result).toBeNull();
      expect(getRoom(room.id)).toBeUndefined();
    });

    it('should assign new host when host leaves', () => {
      const result = leaveRoom(room.id, 'host-123');

      expect(result).not.toBeNull();
      expect(result?.hostId).toBe('p2');
    });

    it('should return null for non-existent room', () => {
      const result = leaveRoom('XXXX', 'p2');

      expect(result).toBeNull();
    });

    it('should handle leaving non-existent player gracefully', () => {
      const result = leaveRoom(room.id, 'non-existent');

      expect(result).not.toBeNull();
      expect(result?.players).toHaveLength(2);
    });
  });

  describe('updatePlayerStatus', () => {
    let room: ReturnType<typeof createRoom>;

    beforeEach(() => {
      room = createRoom('host-123', 'HostPlayer', 'socket-123');
    });

    it('should update player connection status', () => {
      const result = updatePlayerStatus(room.id, 'host-123', 'disconnected');

      expect(result).not.toBeUndefined();
      expect(result?.players[0].status).toBe('disconnected');
    });

    it('should update socket ID when provided', () => {
      const result = updatePlayerStatus(room.id, 'host-123', 'connected', 'new-socket');

      expect(result?.players[0].socketId).toBe('new-socket');
    });

    it('should return undefined for non-existent room', () => {
      const result = updatePlayerStatus('XXXX', 'host-123', 'disconnected');

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent player', () => {
      const result = updatePlayerStatus(room.id, 'non-existent', 'disconnected');

      expect(result).toBeUndefined();
    });
  });

  describe('getPlayer', () => {
    it('should find a player by ID', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');
      joinRoom(room.id, 'p2', 'P2', 's2');

      const player = getPlayer(room.id, 'p2');

      expect(player).toBeDefined();
      expect(player?.name).toBe('P2');
    });

    it('should return undefined for non-existent player', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');

      const player = getPlayer(room.id, 'non-existent');

      expect(player).toBeUndefined();
    });
  });

  describe('getRoomBySocketId', () => {
    it('should find a room by socket ID', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');

      const found = getRoomBySocketId('socket-123');

      expect(found).toBe(room);
    });

    it('should return undefined for unknown socket ID', () => {
      createRoom('host-123', 'HostPlayer', 'socket-123');

      const found = getRoomBySocketId('unknown-socket');

      expect(found).toBeUndefined();
    });
  });

  describe('getPlayerBySocketId', () => {
    it('should find a player by socket ID', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');

      const result = getPlayerBySocketId('socket-123');

      expect(result).toBeDefined();
      expect(result?.room).toBe(room);
      expect(result?.player.id).toBe('host-123');
    });

    it('should return undefined for unknown socket ID', () => {
      createRoom('host-123', 'HostPlayer', 'socket-123');

      const result = getPlayerBySocketId('unknown-socket');

      expect(result).toBeUndefined();
    });
  });

  describe('updateRoomStatus', () => {
    it('should update room status', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');

      const result = updateRoomStatus(room.id, 'playing');

      expect(result?.status).toBe('playing');
    });

    it('should return undefined for non-existent room', () => {
      const result = updateRoomStatus('XXXX', 'playing');

      expect(result).toBeUndefined();
    });
  });

  describe('setGameState', () => {
    it('should store game state in room', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');
      const mockGameState = { id: 'game-123' } as any;

      const result = setGameState(room.id, mockGameState);

      expect(result?.gameState).toBe(mockGameState);
    });

    it('should return undefined for non-existent room', () => {
      const result = setGameState('XXXX', null);

      expect(result).toBeUndefined();
    });
  });

  describe('cleanupInactiveRooms', () => {
    it('should delete rooms that are inactive for too long', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');
      // Manually set lastActivity to the past
      const roomRef = getRoom(room.id);
      if (roomRef) {
        roomRef.lastActivity = Date.now() - 7200000; // 2 hours ago
      }

      cleanupInactiveRooms(3600000); // 1 hour threshold

      expect(getRoom(room.id)).toBeUndefined();
    });

    it('should keep recently active rooms', () => {
      const room = createRoom('host-123', 'HostPlayer', 'socket-123');

      cleanupInactiveRooms(3600000); // 1 hour threshold

      expect(getRoom(room.id)).toBeDefined();
    });
  });
});
