/**
 * Backend Type Definitions
 *
 * Types for game rooms, socket events, and server state.
 */

import { GameState, PlayerAction, GameConfig } from '@splendubious/rules-engine';

// =============================================================================
// ROOM TYPES
// =============================================================================

/**
 * Player connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Player information in a room
 */
export interface RoomPlayer {
  /** Player ID (from Discord) */
  id: string;
  /** Display name */
  name: string;
  /** Socket ID for communication */
  socketId: string | null;
  /** Connection status */
  status: ConnectionStatus;
  /** Whether player is a spectator */
  isSpectator: boolean;
  /** Last activity timestamp */
  lastActivity: number;
}

/**
 * Room status
 */
export type RoomStatus = 'lobby' | 'playing' | 'ended';

/**
 * A game room containing players and game state
 */
export interface GameRoom {
  /** Unique room identifier */
  id: string;
  /** Room status */
  status: RoomStatus;
  /** Host player ID */
  hostId: string;
  /** All players and spectators in the room */
  players: RoomPlayer[];
  /** Game configuration */
  config: GameConfig | null;
  /** Authoritative game state (null if not started) */
  gameState: GameState | null;
  /** Room creation timestamp */
  createdAt: number;
  /** Last activity timestamp */
  lastActivity: number;
}

// =============================================================================
// SOCKET EVENT TYPES
// =============================================================================

/**
 * Events sent from client to server
 */
export interface ClientToServerEvents {
  // Room management
  'room:create': (data: CreateRoomData, callback: RoomCallback) => void;
  'room:join': (data: JoinRoomData, callback: RoomCallback) => void;
  'room:leave': (callback: SuccessCallback) => void;
  'room:update_name': (data: UpdateNameData, callback: SuccessCallback) => void;
  'room:start': (data: StartGameData, callback: SuccessCallback) => void;

  // Game actions
  'game:action': (data: GameActionData, callback: ActionCallback) => void;

  // Heartbeat
  'ping': (callback: (timestamp: number) => void) => void;
}

/**
 * Events sent from server to client
 */
export interface ServerToClientEvents {
  // Room updates
  'room:updated': (room: RoomStateDTO) => void;
  'room:player_joined': (player: PlayerDTO) => void;
  'room:player_left': (playerId: string) => void;
  'room:player_status': (playerId: string, status: ConnectionStatus) => void;

  // Game updates
  'game:started': (state: ClientGameState) => void;
  'game:state_updated': (state: ClientGameState) => void;
  'game:action_applied': (action: PlayerAction, state: ClientGameState) => void;
  'game:ended': (winners: string[]) => void;

  // Errors
  'error': (error: ServerError) => void;
}

/**
 * Inter-server events (for scaling)
 */
export interface InterServerEvents {
  // Reserved for future multi-server setup
}

/**
 * Socket data attached to each connection
 */
export interface SocketData {
  playerId: string;
  playerName: string;
  roomId: string | null;
}

// =============================================================================
// DATA TRANSFER OBJECTS
// =============================================================================

/**
 * Room state sent to clients (safe to expose)
 */
export interface RoomStateDTO {
  id: string;
  status: RoomStatus;
  hostId: string;
  players: PlayerDTO[];
  config: GameConfig | null;
}

/**
 * Player info sent to clients
 */
export interface PlayerDTO {
  id: string;
  name: string;
  status: ConnectionStatus;
  isSpectator: boolean;
}

/**
 * Game state visible to a specific client
 * (hides other players' reserved cards and deck contents)
 */
export interface ClientGameState {
  /** Base game state fields visible to all */
  id: string;
  phase: GameState['phase'];
  currentPlayerIndex: number;
  bank: GameState['bank'];
  market: GameState['market'];
  nobles: GameState['nobles'];
  round: number;
  winners: string[];

  /** Visible player states */
  players: ClientPlayerState[];

  /** Deck counts (not actual cards) */
  deckCounts: {
    tier1: number;
    tier2: number;
    tier3: number;
  };

  /** Actions available to the requesting player */
  availableActions?: import('@splendubious/rules-engine').AvailableActions;
}

/**
 * Player state visible to clients
 */
export interface ClientPlayerState {
  id: string;
  name: string;
  gems: GameState['players'][0]['gems'];
  bonuses: GameState['players'][0]['bonuses'];
  /** Reserved cards - only visible if it's the requesting player */
  reservedCards: GameState['players'][0]['reservedCards'] | null;
  reservedCardCount: number;
  purchasedCards: GameState['players'][0]['purchasedCards'];
  nobles: GameState['players'][0]['nobles'];
  prestigePoints: number;
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

export interface CreateRoomData {
  playerName: string;
}

export interface JoinRoomData {
  roomId: string;
  playerName: string;
  asSpectator?: boolean;
}

export interface UpdateNameData {
  name: string;
}

export interface StartGameData {
  config: GameConfig;
}

export interface GameActionData {
  action: PlayerAction;
}

export interface RoomCallback {
  (response: { success: boolean; room?: RoomStateDTO; playerId?: string; error?: string }): void;
}

export interface SuccessCallback {
  (response: { success: boolean; error?: string }): void;
}

export interface ActionCallback {
  (response: { success: boolean; error?: string }): void;
}

export interface ServerError {
  code: string;
  message: string;
}
