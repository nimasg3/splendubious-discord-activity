/**
 * Game Controller
 *
 * Handles game logic - starting games, processing actions, managing state.
 */

import {
  GameState,
  GameConfig,
  PlayerAction,
  createGame,
  validateAction,
  applyAction,
  getAvailableActions,
} from '@splendubious/rules-engine';
import { ClientGameState, ClientPlayerState } from '../types';
import { getRoom, setGameState, updateRoomStatus } from '../rooms';

// =============================================================================
// GAME LIFECYCLE
// =============================================================================

/**
 * Starts a new game in a room
 *
 * @param roomId - Room to start game in
 * @param config - Game configuration
 * @returns Initial game state or error
 */
export function startGame(
  roomId: string,
  config: GameConfig
): { success: true; state: GameState } | { success: false; error: string } {
  const room = getRoom(roomId);
  
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  if (room.status !== 'lobby') {
    return { success: false, error: 'Game already started or ended' };
  }
  
  // Get non-spectator players
  const players = room.players.filter(p => !p.isSpectator);
  
  if (players.length < config.playerCount) {
    return { success: false, error: `Need ${config.playerCount} players, but only ${players.length} in room` };
  }
  
  if (players.length !== config.playerCount) {
    return { success: false, error: `Player count mismatch: config says ${config.playerCount}, room has ${players.length}` };
  }
  
  // Create player info for game state
  const playerInfo = players.map(p => ({ id: p.id, name: p.name }));
  
  // Create game state using rules engine
  const gameState = createGame(config, playerInfo);
  
  // Store game state and update room status
  setGameState(roomId, gameState);
  updateRoomStatus(roomId, 'playing');
  
  // Update room config
  room.config = config;
  
  return { success: true, state: gameState };
}

/**
 * Processes a player action
 *
 * @param roomId - Room containing the game
 * @param roomId - Room containing the game
 * @param _playerId - Player taking the action (validated in socket handler)
 * @param action - Action to process
 * @returns Updated game state or error
 */
export function processAction(
  roomId: string,
  _playerId: string,
  action: PlayerAction
): { success: true; state: GameState } | { success: false; error: string } {
  const room = getRoom(roomId);
  
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  if (!room.gameState) {
    return { success: false, error: 'Game not started' };
  }
  
  if (room.status !== 'playing') {
    return { success: false, error: 'Game is not in progress' };
  }
  
  // Validate action using rules engine
  const validation = validateAction(room.gameState, action);
  if (!validation.valid) {
    return { success: false, error: validation.error || 'Invalid action' };
  }
  
  // Apply action using rules engine
  const newState = applyAction(room.gameState, action);
  
  // Store updated state
  setGameState(roomId, newState);
  
  // Check for game end
  if (newState.phase === 'ended') {
    updateRoomStatus(roomId, 'ended');
  }
  
  return { success: true, state: newState };
}

/**
 * Ends a game (forfeit, timeout, etc.)
 */
export function endGame(
  roomId: string,
  reason: string
): { success: true } | { success: false; error: string } {
  const room = getRoom(roomId);
  
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  if (room.status !== 'playing') {
    return { success: false, error: 'No game in progress' };
  }
  
  // Update room status
  updateRoomStatus(roomId, 'ended');
  
  // Mark game as ended if state exists
  if (room.gameState) {
    room.gameState.phase = 'ended';
  }
  
  console.log(`Game ended in room ${roomId}: ${reason}`);
  return { success: true };
}

// =============================================================================
// STATE PROJECTION
// =============================================================================

/**
 * Creates a client-visible game state for a specific player
 * Hides opponent's reserved cards and deck contents
 *
 * @param state - Full authoritative game state
 * @param forPlayerId - Player receiving the state
 * @returns State safe to send to client
 */
export function toClientGameState(
  state: GameState,
  forPlayerId: string
): ClientGameState {
  // Find player in state to get name for projection
  const playerIndex = state.players.findIndex((p: GameState['players'][0]) => p.id === forPlayerId);
  
  return {
    id: state.id,
    phase: state.phase,
    currentPlayerIndex: state.currentPlayerIndex,
    bank: { ...state.bank },
    market: {
      tier1: [...state.market.tier1],
      tier2: [...state.market.tier2],
      tier3: [...state.market.tier3],
    },
    nobles: [...state.nobles],
    round: state.round,
    winners: [...state.winners],
    players: state.players.map((p: GameState['players'][0]) => toClientPlayerState(p, p.id === forPlayerId)),
    deckCounts: {
      tier1: state.decks.tier1.length,
      tier2: state.decks.tier2.length,
      tier3: state.decks.tier3.length,
    },
    // Include available actions only for the requesting player if it's their turn
    availableActions: state.currentPlayerIndex === playerIndex 
      ? getAvailableActions(state, forPlayerId)
      : undefined,
  };
}

/**
 * Creates a client-visible player state
 *
 * @param player - Player state
 * @param isRequestingPlayer - Whether this is the player receiving the state
 * @returns Projected player state
 */
export function toClientPlayerState(
  player: GameState['players'][0],
  isRequestingPlayer: boolean
): ClientPlayerState {
  return {
    id: player.id,
    name: player.name,
    gems: { ...player.gems },
    bonuses: { ...player.bonuses },
    // Show reserved cards to all players (public information)
    reservedCards: [...player.reservedCards],
    reservedCardCount: player.reservedCards.length,
    purchasedCards: [...player.purchasedCards],
    nobles: [...player.nobles],
    prestigePoints: player.prestigePoints,
  };
}

// =============================================================================
// TURN VALIDATION
// =============================================================================

/**
 * Checks if it's a specific player's turn
 */
export function isPlayerTurn(roomId: string, playerId: string): boolean {
  const room = getRoom(roomId);
  if (!room?.gameState) {
    return false;
  }
  
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  return currentPlayer?.id === playerId;
}

/**
 * Gets the current player in a game
 */
export function getCurrentPlayerId(roomId: string): string | null {
  const room = getRoom(roomId);
  if (!room?.gameState) {
    return null;
  }
  
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  return currentPlayer?.id ?? null;
}

// =============================================================================
// GAME QUERIES
// =============================================================================

/**
 * Gets the current game state for a room
 */
export function getGameState(roomId: string): GameState | null {
  const room = getRoom(roomId);
  return room?.gameState ?? null;
}

/**
 * Checks if a game is in progress
 */
export function isGameInProgress(roomId: string): boolean {
  const room = getRoom(roomId);
  return room?.status === 'playing' && room.gameState !== null;
}

/**
 * Gets available actions for a player
 */
export function getPlayerAvailableActions(
  roomId: string,
  playerId: string
): ReturnType<typeof getAvailableActions> | null {
  const room = getRoom(roomId);
  if (!room?.gameState) {
    return null;
  }
  
  return getAvailableActions(room.gameState, playerId);
}
