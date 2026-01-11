/**
 * Splendor Rules Engine
 *
 * A fully deterministic, testable rules engine for the Splendor board game.
 *
 * Responsibilities:
 * - Define all Splendor rules
 * - Validate player actions
 * - Apply state transitions
 * - Determine game end
 *
 * @packageDocumentation
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Gem types
  GemColor,
  GemType,
  GemCollection,
  ColoredGemCollection,
  // Card types
  CardTier,
  DevelopmentCard,
  // Noble types
  Noble,
  // Player types
  Player,
  // Game state types
  CardMarket,
  CardDecks,
  GamePhase,
  GameState,
  // Action types
  TakeThreeGemsAction,
  TakeTwoGemsAction,
  ReserveCardAction,
  PurchaseCardAction,
  SelectNobleAction,
  DiscardGemsAction,
  PlayerAction,
  MainAction,
  // Validation types
  ValidationResult,
  ValidationErrorCode,
  // Config types
  GameConfig,
} from './types';

export {
  // Constants
  INITIAL_GEM_COUNTS,
  GAME_CONSTANTS,
  GEM_COLORS,
  GEM_TYPES,
} from './types';

// =============================================================================
// INITIALIZATION EXPORTS
// =============================================================================

export {
  createGame,
  createPlayer,
  createInitialBank,
  createEmptyGemCollection,
  createEmptyColoredGemCollection,
  cloneGameState,
  getCurrentPlayer,
  getPlayerById,
  generateGameId,
  shuffleArray,
} from './initialization';

// =============================================================================
// VALIDATION EXPORTS
// =============================================================================

export {
  validateAction,
  validateTakeThreeGems,
  validateTakeTwoGems,
  validateReserveCard,
  validatePurchaseCard,
  validateSelectNoble,
  validateDiscardGems,
  isPlayersTurn,
  isGameInProgress,
  calculateEffectiveCost,
  canAffordCard,
  getEligibleNobles,
  getTotalGems,
  needsToDiscardGems,
} from './validators';

// =============================================================================
// ACTION EXPORTS
// =============================================================================

export {
  applyAction,
  applyTakeThreeGems,
  applyTakeTwoGems,
  applyReserveCard,
  applyPurchaseCard,
  applySelectNoble,
  applyDiscardGems,
  advanceTurn,
  checkNobleAcquisition,
  refillMarket,
  checkGameEndTrigger,
  checkGameEnd,
  determineWinners,
  calculatePayment,
} from './actions';

// =============================================================================
// AVAILABILITY EXPORTS
// =============================================================================

export type {
  AvailableActions,
  TakeGemsOptions,
  ReservableCards,
  PurchasableCards,
} from './availability';

export {
  getAvailableActions,
  getTakeGemOptions,
  getReservableCards,
  getPurchasableCards,
  canPurchaseCard,
  getCardShortfall,
  getMarketCards,
  getMarketCardsByTier,
  hasDeckCards,
} from './availability';

// =============================================================================
// DATA EXPORTS
// =============================================================================

export {
  TIER_1_CARDS,
  TIER_2_CARDS,
  TIER_3_CARDS,
  NOBLES,
  getAllCards,
  getCardsByTier,
  getAllNobles,
  findCardById,
  findNobleById,
} from './data';
