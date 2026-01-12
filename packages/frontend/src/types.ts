/**
 * Frontend Type Definitions
 *
 * Types for the React frontend application.
 */

import { AvailableActions, GemColor, CardTier } from '@splendubious/rules-engine';

// =============================================================================
// RE-EXPORT BACKEND TYPES FOR CLIENT USE
// =============================================================================

/**
 * Connection status (matches backend)
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Room status (matches backend)
 */
export type RoomStatus = 'lobby' | 'playing' | 'ended';

/**
 * Player info from server
 */
export interface PlayerDTO {
  id: string;
  name: string;
  status: ConnectionStatus;
  isSpectator: boolean;
}

/**
 * Room state from server
 */
export interface RoomStateDTO {
  id: string;
  status: RoomStatus;
  hostId: string;
  players: PlayerDTO[];
  config: { playerCount: 2 | 3 | 4 } | null;
}

/**
 * Client game state from server
 */
export interface ClientGameState {
  id: string;
  phase: 'waiting' | 'playing' | 'final_round' | 'ended';
  currentPlayerIndex: number;
  bank: Record<string, number>;
  market: {
    tier1: (CardDisplay | null)[];
    tier2: (CardDisplay | null)[];
    tier3: (CardDisplay | null)[];
  };
  nobles: NobleDisplay[];
  round: number;
  winners: string[];
  players: ClientPlayerState[];
  deckCounts: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  availableActions?: AvailableActions;
}

/**
 * Player state visible to client
 */
export interface ClientPlayerState {
  id: string;
  name: string;
  gems: Record<string, number>;
  bonuses: Record<string, number>;
  reservedCards: CardDisplay[] | null;
  reservedCardCount: number;
  purchasedCards: CardDisplay[];
  nobles: NobleDisplay[];
  prestigePoints: number;
}

/**
 * Card display information
 */
export interface CardDisplay {
  id: string;
  tier: CardTier;
  cost: Record<GemColor, number>;
  bonus: GemColor;
  prestigePoints: number;
}

/**
 * Noble display information
 */
export interface NobleDisplay {
  id: string;
  requirements: Record<GemColor, number>;
  prestigePoints: number;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

/**
 * Current screen in the app
 */
export type AppScreen = 'loading' | 'menu' | 'lobby' | 'game';

/**
 * Selected action in UI
 */
export type SelectedAction =
  | { type: 'none' }
  | { type: 'take_gems'; gems: GemColor[] }
  | { type: 'reserve_card'; cardId: string | null; tier: CardTier }
  | { type: 'purchase_card'; cardId: string }
  | { type: 'select_noble'; nobleId: string }
  | { type: 'discard_gems'; gems: Partial<Record<GemColor | 'gold', number>> };

/**
 * UI configuration
 */
export interface UIConfig {
  animationSpeed: 'slow' | 'normal' | 'fast';
  showHints: boolean;
  soundEnabled: boolean;
}

// =============================================================================
// DISCORD TYPES
// =============================================================================

/**
 * Discord user info
 */
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  globalName: string | null;
}

/**
 * Discord activity participants
 */
export interface ActivityParticipant {
  id: string;
  username: string;
}
