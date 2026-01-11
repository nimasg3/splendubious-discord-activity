/**
 * Game Controller Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  startGame,
  processAction,
  endGame,
  toClientGameState,
  toClientPlayerState,
  isPlayerTurn,
  getCurrentPlayerId,
  getGameState,
  isGameInProgress,
  getPlayerAvailableActions,
} from '../game';
import {
  createRoom,
  joinRoom,
  getRoom,
  deleteRoom,
  getAllRooms,
} from '../rooms';
import { GameConfig, createGame } from '@splendubious/rules-engine';

describe('Game Controller', () => {
  // Clean up rooms before and after each test
  beforeEach(() => {
    const rooms = getAllRooms();
    rooms.forEach(room => deleteRoom(room.id));
  });

  afterEach(() => {
    const rooms = getAllRooms();
    rooms.forEach(room => deleteRoom(room.id));
  });

  describe('startGame', () => {
    it('should start a game with valid config and players', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');

      const config: GameConfig = { playerCount: 2 };
      const result = startGame(room.id, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.state).toBeDefined();
        expect(result.state.players).toHaveLength(2);
        expect(result.state.phase).toBe('playing');
      }
    });

    it('should return error for non-existent room', () => {
      const config: GameConfig = { playerCount: 2 };
      const result = startGame('XXXX', config);

      expect(result).toEqual({ success: false, error: 'Room not found' });
    });

    it('should return error if room is not in lobby status', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');

      // Start the game first
      startGame(room.id, { playerCount: 2 });

      // Try to start again
      const result = startGame(room.id, { playerCount: 2 });

      expect(result).toEqual({ success: false, error: 'Game already started or ended' });
    });

    it('should return error if not enough players', () => {
      const room = createRoom('p1', 'Player1', 's1');

      const config: GameConfig = { playerCount: 2 };
      const result = startGame(room.id, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Need 2 players');
      }
    });

    it('should return error if player count mismatch', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      joinRoom(room.id, 'p3', 'Player3', 's3');

      const config: GameConfig = { playerCount: 2 };
      const result = startGame(room.id, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Player count mismatch');
      }
    });

    it('should update room status to playing', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');

      startGame(room.id, { playerCount: 2 });

      expect(getRoom(room.id)?.status).toBe('playing');
    });

    it('should ignore spectators when counting players', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      joinRoom(room.id, 'spectator', 'Spectator', 's3', true);

      const result = startGame(room.id, { playerCount: 2 });

      expect(result.success).toBe(true);
    });
  });

  describe('processAction', () => {
    let room: ReturnType<typeof createRoom>;

    beforeEach(() => {
      room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });
    });

    it('should process a valid action', () => {
      // Get the current player
      const gameState = getGameState(room.id)!;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      // Find gems that have 4+ available for TAKE_TWO
      const availableGems = Object.entries(gameState.bank)
        .filter(([gem, count]) => gem !== 'gold' && count >= 4)
        .map(([gem]) => gem);
      
      if (availableGems.length > 0) {
        const gem = availableGems[0] as 'emerald' | 'diamond' | 'sapphire' | 'onyx' | 'ruby';
        const result = processAction(room.id, currentPlayer.id, {
          type: 'TAKE_TWO_GEMS',
          playerId: currentPlayer.id,
          gem,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should return error for non-existent room', () => {
      const result = processAction('XXXX', 'p1', {
        type: 'TAKE_THREE_GEMS',
        playerId: 'p1',
        gems: ['emerald', 'diamond', 'sapphire'],
      });

      expect(result).toEqual({ success: false, error: 'Room not found' });
    });

    it('should return error if game not started', () => {
      const newRoom = createRoom('p1', 'Player1', 's1');

      const result = processAction(newRoom.id, 'p1', {
        type: 'TAKE_THREE_GEMS',
        playerId: 'p1',
        gems: ['emerald', 'diamond', 'sapphire'],
      });

      expect(result).toEqual({ success: false, error: 'Game not started' });
    });

    it('should return error for invalid action', () => {
      // Get the player who is NOT current
      const gameState = getGameState(room.id)!;
      const notCurrentIndex = (gameState.currentPlayerIndex + 1) % 2;
      const notCurrentPlayer = gameState.players[notCurrentIndex];

      const result = processAction(room.id, notCurrentPlayer.id, {
        type: 'TAKE_THREE_GEMS',
        playerId: notCurrentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('endGame', () => {
    it('should end a game in progress', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      const result = endGame(room.id, 'Forfeit');

      expect(result).toEqual({ success: true });
      expect(getRoom(room.id)?.status).toBe('ended');
    });

    it('should return error for non-existent room', () => {
      const result = endGame('XXXX', 'Forfeit');

      expect(result).toEqual({ success: false, error: 'Room not found' });
    });

    it('should return error if no game in progress', () => {
      const room = createRoom('p1', 'Player1', 's1');

      const result = endGame(room.id, 'Forfeit');

      expect(result).toEqual({ success: false, error: 'No game in progress' });
    });
  });

  describe('toClientGameState', () => {
    it('should create client-safe state with hidden opponent info', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      const gameState = getGameState(room.id)!;
      const clientState = toClientGameState(gameState, 'p1');

      expect(clientState.id).toBe(gameState.id);
      expect(clientState.phase).toBe(gameState.phase);
      expect(clientState.players).toHaveLength(2);
      expect(clientState.deckCounts).toBeDefined();
      expect(clientState.deckCounts.tier1).toBeGreaterThanOrEqual(0);
    });

    it('should include reserved cards for all players', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      const gameState = getGameState(room.id)!;
      const clientState = toClientGameState(gameState, 'p1');

      // Find p1 in the client state
      const p1Client = clientState.players.find(p => p.id === 'p1');
      const p2Client = clientState.players.find(p => p.id === 'p2');

      expect(p1Client?.reservedCards).not.toBeNull(); // Own cards visible
      expect(p2Client?.reservedCards).not.toBeNull(); // Opponent cards also visible
    });

    it('should include deck counts instead of actual cards', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      const gameState = getGameState(room.id)!;
      const clientState = toClientGameState(gameState, 'p1');

      // Should have deck counts
      expect(typeof clientState.deckCounts.tier1).toBe('number');
      expect(typeof clientState.deckCounts.tier2).toBe('number');
      expect(typeof clientState.deckCounts.tier3).toBe('number');

      // Actual decks should not be present (they're not in ClientGameState interface)
      expect((clientState as any).decks).toBeUndefined();
    });
  });

  describe('toClientPlayerState', () => {
    it('should include reserved cards for requesting player', () => {
      const player = {
        id: 'p1',
        name: 'Player1',
        gems: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 },
        bonuses: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        reservedCards: [],
        purchasedCards: [],
        nobles: [],
        prestigePoints: 0,
      };

      const clientState = toClientPlayerState(player, true);

      expect(clientState.reservedCards).not.toBeNull();
      expect(Array.isArray(clientState.reservedCards)).toBe(true);
    });

    it('should show reserved cards for all players', () => {
      const player = {
        id: 'p1',
        name: 'Player1',
        gems: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 },
        bonuses: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        reservedCards: [],
        purchasedCards: [],
        nobles: [],
        prestigePoints: 0,
      };

      const clientState = toClientPlayerState(player, false);

      expect(clientState.reservedCards).not.toBeNull();
      expect(Array.isArray(clientState.reservedCards)).toBe(true);
    });

    it('should always include reserved card count', () => {
      const player = {
        id: 'p1',
        name: 'Player1',
        gems: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 },
        bonuses: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        reservedCards: [{}, {}, {}] as any[], // 3 cards
        purchasedCards: [],
        nobles: [],
        prestigePoints: 0,
      };

      const clientStateOwner = toClientPlayerState(player, true);
      const clientStateOther = toClientPlayerState(player, false);

      expect(clientStateOwner.reservedCardCount).toBe(3);
      expect(clientStateOther.reservedCardCount).toBe(3);
    });
  });

  describe('isPlayerTurn', () => {
    it('should return true when it is the player turn', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      const gameState = getGameState(room.id)!;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      expect(isPlayerTurn(room.id, currentPlayer.id)).toBe(true);
    });

    it('should return false when it is not the player turn', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      const gameState = getGameState(room.id)!;
      const notCurrentIndex = (gameState.currentPlayerIndex + 1) % 2;
      const notCurrentPlayer = gameState.players[notCurrentIndex];

      expect(isPlayerTurn(room.id, notCurrentPlayer.id)).toBe(false);
    });

    it('should return false for non-existent room', () => {
      expect(isPlayerTurn('XXXX', 'p1')).toBe(false);
    });
  });

  describe('getCurrentPlayerId', () => {
    it('should return the current player ID', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      const gameState = getGameState(room.id)!;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      expect(getCurrentPlayerId(room.id)).toBe(currentPlayer.id);
    });

    it('should return null for non-existent room', () => {
      expect(getCurrentPlayerId('XXXX')).toBeNull();
    });

    it('should return null if game not started', () => {
      const room = createRoom('p1', 'Player1', 's1');

      expect(getCurrentPlayerId(room.id)).toBeNull();
    });
  });

  describe('getGameState', () => {
    it('should return the game state', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      const state = getGameState(room.id);

      expect(state).not.toBeNull();
      expect(state?.players).toHaveLength(2);
    });

    it('should return null for non-existent room', () => {
      expect(getGameState('XXXX')).toBeNull();
    });

    it('should return null if game not started', () => {
      const room = createRoom('p1', 'Player1', 's1');

      expect(getGameState(room.id)).toBeNull();
    });
  });

  describe('isGameInProgress', () => {
    it('should return true when game is in progress', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      expect(isGameInProgress(room.id)).toBe(true);
    });

    it('should return false when game not started', () => {
      const room = createRoom('p1', 'Player1', 's1');

      expect(isGameInProgress(room.id)).toBe(false);
    });

    it('should return false for non-existent room', () => {
      expect(isGameInProgress('XXXX')).toBe(false);
    });
  });

  describe('getPlayerAvailableActions', () => {
    it('should return available actions for a player', () => {
      const room = createRoom('p1', 'Player1', 's1');
      joinRoom(room.id, 'p2', 'Player2', 's2');
      startGame(room.id, { playerCount: 2 });

      const gameState = getGameState(room.id)!;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      const actions = getPlayerAvailableActions(room.id, currentPlayer.id);

      expect(actions).not.toBeNull();
      expect(actions?.takeGems).toBeDefined();
      expect(actions?.reservableCards).toBeDefined();
      expect(actions?.purchasableCards).toBeDefined();
      expect(actions?.isPlayerTurn).toBe(true);
    });

    it('should return null for non-existent room', () => {
      expect(getPlayerAvailableActions('XXXX', 'p1')).toBeNull();
    });
  });
});
