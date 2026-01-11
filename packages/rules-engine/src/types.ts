/**
 * Splendor Rules Engine - Type Definitions
 *
 * This file defines all core types for the Splendor game state and actions.
 */

// =============================================================================
// GEM TYPES
// =============================================================================

/**
 * The five basic gem colors used for purchasing cards
 */
export type GemColor = 'emerald' | 'diamond' | 'sapphire' | 'onyx' | 'ruby';

/**
 * All gem types including gold (wild/joker)
 */
export type GemType = GemColor | 'gold';

/**
 * A collection of gems, keyed by gem type
 */
export type GemCollection = Record<GemType, number>;

/**
 * A collection of only colored gems (no gold)
 */
export type ColoredGemCollection = Record<GemColor, number>;

// =============================================================================
// CARD TYPES
// =============================================================================

/**
 * Development card tiers
 */
export type CardTier = 1 | 2 | 3;

/**
 * A development card that can be purchased or reserved
 */
export interface DevelopmentCard {
  /** Unique identifier for the card */
  id: string;
  /** Card tier (1, 2, or 3) */
  tier: CardTier;
  /** Cost in gems to purchase this card */
  cost: ColoredGemCollection;
  /** Permanent gem bonus this card provides when purchased */
  bonus: GemColor;
  /** Prestige points awarded when purchased */
  prestigePoints: number;
}

// =============================================================================
// NOBLE TYPES
// =============================================================================

/**
 * A noble tile that can be attracted by accumulating bonuses
 */
export interface Noble {
  /** Unique identifier for the noble */
  id: string;
  /** Required permanent bonuses to attract this noble */
  requirements: ColoredGemCollection;
  /** Prestige points awarded (always 3) */
  prestigePoints: 3;
}

// =============================================================================
// PLAYER TYPES
// =============================================================================

/**
 * Complete player state
 */
export interface Player {
  /** Unique player identifier */
  id: string;
  /** Display name */
  name: string;
  /** Currently held gem tokens */
  gems: GemCollection;
  /** Permanent gem discounts from purchased cards */
  bonuses: ColoredGemCollection;
  /** Reserved development cards (max 3) */
  reservedCards: DevelopmentCard[];
  /** All purchased development cards */
  purchasedCards: DevelopmentCard[];
  /** Nobles the player has attracted */
  nobles: Noble[];
  /** Total prestige points */
  prestigePoints: number;
}

// =============================================================================
// GAME STATE TYPES
// =============================================================================

/**
 * The card market showing available face-up cards
 */
export interface CardMarket {
  /** Face-up tier 1 cards (up to 4) */
  tier1: DevelopmentCard[];
  /** Face-up tier 2 cards (up to 4) */
  tier2: DevelopmentCard[];
  /** Face-up tier 3 cards (up to 4) */
  tier3: DevelopmentCard[];
}

/**
 * Hidden deck information (remaining cards)
 */
export interface CardDecks {
  /** Remaining tier 1 cards */
  tier1: DevelopmentCard[];
  /** Remaining tier 2 cards */
  tier2: DevelopmentCard[];
  /** Remaining tier 3 cards */
  tier3: DevelopmentCard[];
}

/**
 * Game phase enumeration
 */
export type GamePhase =
  | 'waiting'        // Waiting for players to join
  | 'playing'        // Game in progress
  | 'final_round'    // Someone hit 15 points, finishing the round
  | 'ended';         // Game complete

/**
 * Complete authoritative game state
 */
export interface GameState {
  /** Unique game identifier */
  id: string;
  /** Current game phase */
  phase: GamePhase;
  /** All players in turn order */
  players: Player[];
  /** Index of current player in players array */
  currentPlayerIndex: number;
  /** Gem tokens available in the bank */
  bank: GemCollection;
  /** Face-up cards available for purchase/reservation */
  market: CardMarket;
  /** Hidden deck cards (not visible to players) */
  decks: CardDecks;
  /** Available nobles */
  nobles: Noble[];
  /** Round number (increments after all players take a turn) */
  round: number;
  /** Player ID who triggered end game (undefined if not triggered) */
  endGameTriggeredBy: string | undefined;
  /** Winner player IDs (empty until game ends, can have multiple for ties) */
  winners: string[];
  /** Player ID who must discard gems (undefined if not applicable) */
  pendingGemDiscard: string | undefined;
  /** Player ID who must select a noble (undefined if not applicable) */
  pendingNobleSelection: string | undefined;
}

// =============================================================================
// ACTION TYPES
// =============================================================================

/**
 * Take 1-3 gems of different colors
 */
export interface TakeThreeGemsAction {
  type: 'TAKE_THREE_GEMS';
  playerId: string;
  /** 1-3 different gem colors */
  gems: GemColor[];
}

/**
 * Take 2 gems of the same color
 */
export interface TakeTwoGemsAction {
  type: 'TAKE_TWO_GEMS';
  playerId: string;
  /** The gem color to take 2 of */
  gem: GemColor;
}

/**
 * Reserve a development card
 */
export interface ReserveCardAction {
  type: 'RESERVE_CARD';
  playerId: string;
  /** Card ID if reserving from market, null if taking from deck top */
  cardId: string | null;
  /** Tier to take from (required if cardId is null for blind draw) */
  tier: CardTier;
}

/**
 * Purchase a development card
 */
export interface PurchaseCardAction {
  type: 'PURCHASE_CARD';
  playerId: string;
  /** Card ID to purchase (from market or reserved) */
  cardId: string;
  /** Gold gems used as wildcards (optional optimization) */
  goldUsed?: number;
}

/**
 * Select a noble when multiple are available
 */
export interface SelectNobleAction {
  type: 'SELECT_NOBLE';
  playerId: string;
  /** Noble ID to claim */
  nobleId: string;
}

/**
 * Discard excess gems when over 10
 */
export interface DiscardGemsAction {
  type: 'DISCARD_GEMS';
  playerId: string;
  /** Gems to discard */
  gems: Partial<GemCollection>;
}

/**
 * All possible player actions
 */
export type PlayerAction =
  | TakeThreeGemsAction
  | TakeTwoGemsAction
  | ReserveCardAction
  | PurchaseCardAction
  | SelectNobleAction
  | DiscardGemsAction;

/**
 * Main game actions (one per turn)
 */
export type MainAction =
  | TakeThreeGemsAction
  | TakeTwoGemsAction
  | ReserveCardAction
  | PurchaseCardAction;

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Result of action validation
 */
export interface ValidationResult {
  /** Whether the action is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: ValidationErrorCode;
}

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'NOT_PLAYERS_TURN'
  | 'INSUFFICIENT_GEMS_IN_BANK'
  | 'GEMS_NOT_DISTINCT'
  | 'REQUIRES_FOUR_GEMS_FOR_TWO'
  | 'CANNOT_TAKE_GOLD'
  | 'MAX_RESERVED_CARDS'
  | 'CARD_NOT_AVAILABLE'
  | 'INSUFFICIENT_PAYMENT'
  | 'NOBLE_NOT_ELIGIBLE'
  | 'MUST_DISCARD_GEMS'
  | 'INVALID_DISCARD_AMOUNT'
  | 'GAME_NOT_IN_PROGRESS'
  | 'INVALID_ACTION';

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

/**
 * Configuration for game setup
 */
export interface GameConfig {
  /** Number of players (2-4) */
  playerCount: 2 | 3 | 4;
}

/**
 * Initial gem counts based on player count
 */
export const INITIAL_GEM_COUNTS: Record<2 | 3 | 4, { colored: number; gold: number }> = {
  2: { colored: 4, gold: 5 },
  3: { colored: 5, gold: 5 },
  4: { colored: 7, gold: 5 },
};

/**
 * Game constants
 */
export const GAME_CONSTANTS = {
  /** Maximum gems a player can hold */
  MAX_GEMS: 10,
  /** Maximum reserved cards a player can hold */
  MAX_RESERVED_CARDS: 3,
  /** Prestige points needed to trigger end game */
  WINNING_POINTS: 15,
  /** Noble prestige points */
  NOBLE_POINTS: 3 as const,
  /** Cards visible per tier in market */
  MARKET_SIZE: 4,
  /** Minimum gems required for "take 2 same" action */
  MIN_GEMS_FOR_TAKE_TWO: 4,
} as const;

/**
 * All gem colors (excluding gold)
 */
export const GEM_COLORS: readonly GemColor[] = [
  'emerald',
  'diamond',
  'sapphire',
  'onyx',
  'ruby',
] as const;

/**
 * All gem types (including gold)
 */
export const GEM_TYPES: readonly GemType[] = [
  ...GEM_COLORS,
  'gold',
] as const;
