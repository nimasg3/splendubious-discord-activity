/**
 * Action Availability
 *
 * Functions to determine what actions are available to a player.
 * Used by frontend to disable illegal actions (UX only).
 */

import {
  GameState,
  GemColor,
  CardTier,
  DevelopmentCard,
  GEM_COLORS,
  GAME_CONSTANTS,
} from './types.js';
import { getPlayerById } from './initialization.js';
import { 
  isPlayersTurn, 
  isGameInProgress, 
  canAffordCard, 
  calculateEffectiveCost,
  getEligibleNobles,
  getTotalGems,
} from './validators.js';

// =============================================================================
// AVAILABLE ACTIONS
// =============================================================================

/**
 * Information about available actions for a player
 */
export interface AvailableActions {
  /** Whether it's this player's turn */
  isPlayerTurn: boolean;
  /** Whether the player must discard gems before other actions */
  mustDiscardGems: boolean;
  /** Number of gems to discard (0 if not needed) */
  gemsToDiscard: number;
  /** Whether player must select a noble */
  mustSelectNoble: boolean;
  /** Available nobles to select (empty if not applicable) */
  selectableNobles: string[];
  /** Available gem taking options */
  takeGems: TakeGemsOptions;
  /** Cards available for reservation */
  reservableCards: ReservableCards;
  /** Cards available for purchase */
  purchasableCards: PurchasableCards;
}

/**
 * Options for taking gems
 */
export interface TakeGemsOptions {
  /** Whether taking 3 different gems is possible */
  canTakeThree: boolean;
  /** Available colors for taking 3 (need at least 3) */
  availableForThree: GemColor[];
  /** Colors where taking 2 is possible (bank has 4+) */
  availableForTwo: GemColor[];
}

/**
 * Information about reservable cards
 */
export interface ReservableCards {
  /** Whether player can reserve (has < 3 reserved) */
  canReserve: boolean;
  /** Card IDs available for reservation from market */
  marketCards: string[];
  /** Tiers where blind draw is possible */
  blindDrawTiers: CardTier[];
}

/**
 * Information about purchasable cards
 */
export interface PurchasableCards {
  /** Card IDs from market that can be purchased */
  marketCards: string[];
  /** Card IDs from reserved that can be purchased */
  reservedCards: string[];
}

// =============================================================================
// MAIN AVAILABILITY FUNCTION
// =============================================================================

/**
 * Gets all available actions for a player
 *
 * @param state - Current game state
 * @param playerId - Player to check actions for
 * @returns Available actions for the player
 */
export function getAvailableActions(
  state: GameState,
  playerId: string
): AvailableActions {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return getEmptyAvailableActions();
  }

  const isMyTurn = isPlayersTurn(state, playerId) && isGameInProgress(state);
  const totalGems = getTotalGems(state, playerId);
  const eligibleNobleIds = getEligibleNobles(state, playerId);
  
  // Check if waiting for noble selection
  const mustSelectNoble = state.pendingNobleSelection === playerId && eligibleNobleIds.length > 1;
  
  // Check if waiting for gem discard
  const mustDiscardGems = state.pendingGemDiscard === playerId;
  const gemsToDiscard = mustDiscardGems ? totalGems - GAME_CONSTANTS.MAX_GEMS : 0;

  // If not player's turn or must do something first, limit options
  if (!isMyTurn || mustDiscardGems || mustSelectNoble) {
    return {
      isPlayerTurn: isMyTurn,
      mustDiscardGems,
      gemsToDiscard,
      mustSelectNoble,
      selectableNobles: mustSelectNoble ? eligibleNobleIds : [],
      takeGems: { canTakeThree: false, availableForThree: [], availableForTwo: [] },
      reservableCards: { canReserve: false, marketCards: [], blindDrawTiers: [] },
      purchasableCards: { marketCards: [], reservedCards: [] },
    };
  }

  return {
    isPlayerTurn: isMyTurn,
    mustDiscardGems,
    gemsToDiscard,
    mustSelectNoble,
    selectableNobles: [],
    takeGems: getTakeGemOptions(state),
    reservableCards: getReservableCards(state, playerId),
    purchasableCards: getPurchasableCards(state, playerId),
  };
}

/**
 * Returns empty available actions (no actions possible)
 */
function getEmptyAvailableActions(): AvailableActions {
  return {
    isPlayerTurn: false,
    mustDiscardGems: false,
    gemsToDiscard: 0,
    mustSelectNoble: false,
    selectableNobles: [],
    takeGems: { canTakeThree: false, availableForThree: [], availableForTwo: [] },
    reservableCards: { canReserve: false, marketCards: [], blindDrawTiers: [] },
    purchasableCards: { marketCards: [], reservedCards: [] },
  };
}

// =============================================================================
// SPECIFIC AVAILABILITY CHECKERS
// =============================================================================

/**
 * Gets available gem taking options
 */
export function getTakeGemOptions(state: GameState): TakeGemsOptions {
  // Find colors with at least 1 gem (for taking 1-3 different)
  const availableForThree: GemColor[] = [];
  // Find colors with at least 4 gems (for take 2 same)
  const availableForTwo: GemColor[] = [];

  for (const color of GEM_COLORS) {
    if (state.bank[color] >= 1) {
      availableForThree.push(color);
    }
    if (state.bank[color] >= GAME_CONSTANTS.MIN_GEMS_FOR_TAKE_TWO) {
      availableForTwo.push(color);
    }
  }

  return {
    // Can take different gems as long as at least 1 color is available
    canTakeThree: availableForThree.length >= 1,
    availableForThree,
    availableForTwo,
  };
}

/**
 * Gets reservable card information
 */
export function getReservableCards(
  state: GameState,
  playerId: string
): ReservableCards {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { canReserve: false, marketCards: [], blindDrawTiers: [] };
  }

  const canReserve = player.reservedCards.length < GAME_CONSTANTS.MAX_RESERVED_CARDS;
  
  if (!canReserve) {
    return { canReserve: false, marketCards: [], blindDrawTiers: [] };
  }

  // Get all market card IDs
  const marketCards = getMarketCards(state).map(c => c.id);
  
  // Check which tier decks have cards for blind draw
  const blindDrawTiers: CardTier[] = [];
  if (hasDeckCards(state, 1)) blindDrawTiers.push(1);
  if (hasDeckCards(state, 2)) blindDrawTiers.push(2);
  if (hasDeckCards(state, 3)) blindDrawTiers.push(3);

  return { canReserve, marketCards, blindDrawTiers };
}

/**
 * Gets purchasable card information
 */
export function getPurchasableCards(
  state: GameState,
  playerId: string
): PurchasableCards {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { marketCards: [], reservedCards: [] };
  }

  const marketCards: string[] = [];
  const reservedCards: string[] = [];

  // Check market cards
  for (const card of getMarketCards(state)) {
    if (canAffordCard(state, playerId, card.id)) {
      marketCards.push(card.id);
    }
  }

  // Check reserved cards
  for (const card of player.reservedCards) {
    if (canAffordCard(state, playerId, card.id)) {
      reservedCards.push(card.id);
    }
  }

  return { marketCards, reservedCards };
}

/**
 * Checks if a specific card can be purchased by a player
 */
export function canPurchaseCard(
  state: GameState,
  playerId: string,
  cardId: string
): boolean {
  return canAffordCard(state, playerId, cardId);
}

/**
 * Gets the gem shortfall for purchasing a card
 * (helps UI show what player needs)
 */
export function getCardShortfall(
  state: GameState,
  playerId: string,
  cardId: string
): Record<GemColor, number> {
  const player = getPlayerById(state, playerId);
  if (!player) {
    return { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 };
  }

  const effectiveCost = calculateEffectiveCost(state, playerId, cardId);
  if (!effectiveCost) {
    return { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 };
  }

  // Calculate shortfall for each color
  const shortfall: Record<GemColor, number> = {
    emerald: 0,
    diamond: 0,
    sapphire: 0,
    onyx: 0,
    ruby: 0,
  };

  let totalShortfall = 0;
  for (const color of GEM_COLORS) {
    const needed = effectiveCost[color] - player.gems[color];
    if (needed > 0) {
      shortfall[color] = needed;
      totalShortfall += needed;
    }
  }

  // Subtract available gold from shortfall (spread across colors)
  let goldAvailable = player.gems.gold;
  for (const color of GEM_COLORS) {
    if (goldAvailable > 0 && shortfall[color] > 0) {
      const goldUsed = Math.min(goldAvailable, shortfall[color]);
      shortfall[color] -= goldUsed;
      goldAvailable -= goldUsed;
    }
  }

  return shortfall;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Gets all cards visible in the market (excludes null slots)
 */
export function getMarketCards(state: GameState): DevelopmentCard[] {
  return [
    ...state.market.tier1.filter((c): c is DevelopmentCard => c !== null),
    ...state.market.tier2.filter((c): c is DevelopmentCard => c !== null),
    ...state.market.tier3.filter((c): c is DevelopmentCard => c !== null),
  ];
}

/**
 * Gets market cards by tier (excludes null slots)
 */
export function getMarketCardsByTier(
  state: GameState,
  tier: CardTier
): DevelopmentCard[] {
  switch (tier) {
    case 1:
      return state.market.tier1.filter((c): c is DevelopmentCard => c !== null);
    case 2:
      return state.market.tier2.filter((c): c is DevelopmentCard => c !== null);
    case 3:
      return state.market.tier3.filter((c): c is DevelopmentCard => c !== null);
  }
}

/**
 * Checks if a deck has cards remaining
 */
export function hasDeckCards(state: GameState, tier: CardTier): boolean {
  switch (tier) {
    case 1:
      return state.decks.tier1.length > 0;
    case 2:
      return state.decks.tier2.length > 0;
    case 3:
      return state.decks.tier3.length > 0;
  }
}
