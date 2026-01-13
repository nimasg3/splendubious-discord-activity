/**
 * Action Validators
 *
 * Functions to validate player actions before they are applied.
 * All validation must occur before state mutation.
 */

import {
  GameState,
  PlayerAction,
  TakeThreeGemsAction,
  TakeTwoGemsAction,
  ReserveCardAction,
  PurchaseCardAction,
  SelectNobleAction,
  DiscardGemsAction,
  ValidationResult,
  GemColor,
  DevelopmentCard,
  GAME_CONSTANTS,
  GEM_COLORS,
} from './types.js';
import { getCurrentPlayer, getPlayerById } from './initialization.js';

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validates any player action
 *
 * @param state - Current game state
 * @param action - Action to validate
 * @returns ValidationResult indicating if action is valid
 */
export function validateAction(state: GameState, action: PlayerAction): ValidationResult {
  // Check game is in valid phase
  if (!isGameInProgress(state)) {
    return { valid: false, error: 'Game is not in progress', errorCode: 'GAME_NOT_IN_PROGRESS' };
  }

  // Dispatch to specific validator based on action type
  switch (action.type) {
    case 'TAKE_THREE_GEMS':
      return validateTakeThreeGems(state, action);
    case 'TAKE_TWO_GEMS':
      return validateTakeTwoGems(state, action);
    case 'RESERVE_CARD':
      return validateReserveCard(state, action);
    case 'PURCHASE_CARD':
      return validatePurchaseCard(state, action);
    case 'SELECT_NOBLE':
      return validateSelectNoble(state, action);
    case 'DISCARD_GEMS':
      return validateDiscardGems(state, action);
    default:
      return { valid: false, error: 'Invalid action type', errorCode: 'INVALID_ACTION' };
  }
}

// =============================================================================
// SPECIFIC ACTION VALIDATORS
// =============================================================================

/**
 * Validates taking 1-3 different gems
 *
 * Rules:
 * - Must take 1-3 gems of different colors
 * - Colors must be among the 5 non-gold gem types
 * - Each chosen gem must be available in the bank
 */
export function validateTakeThreeGems(
  state: GameState,
  action: TakeThreeGemsAction
): ValidationResult {
  // Verify it's the player's turn
  if (!isPlayersTurn(state, action.playerId)) {
    return { valid: false, error: "It's not your turn", errorCode: 'NOT_PLAYERS_TURN' };
  }

  const { gems } = action;

  // Verify 1-3 gems requested
  if (gems.length < 1 || gems.length > 3) {
    return { valid: false, error: 'Must take 1 to 3 gems', errorCode: 'INVALID_ACTION' };
  }

  // Verify all gems are different colors
  const uniqueGems = new Set(gems);
  if (uniqueGems.size !== gems.length) {
    return { valid: false, error: 'All gems must be different colors', errorCode: 'GEMS_NOT_DISTINCT' };
  }

  // Verify no gold gems requested (gold is not in GemColor type, but check anyway)
  for (const gem of gems) {
    if (!GEM_COLORS.includes(gem)) {
      return { valid: false, error: 'Cannot take gold gems with this action', errorCode: 'CANNOT_TAKE_GOLD' };
    }
  }

  // Verify each gem is available in bank
  for (const gem of gems) {
    if (state.bank[gem] < 1) {
      return { 
        valid: false, 
        error: `Not enough ${gem} gems in bank`, 
        errorCode: 'INSUFFICIENT_GEMS_IN_BANK' 
      };
    }
  }

  return { valid: true };
}

/**
 * Validates taking 2 gems of the same color
 *
 * Rules:
 * - Take 2 gems of the same color
 * - The bank must have at least 4 gems of that color
 * - Gold gems cannot be taken this way
 */
export function validateTakeTwoGems(
  state: GameState,
  action: TakeTwoGemsAction
): ValidationResult {
  // Verify it's the player's turn
  if (!isPlayersTurn(state, action.playerId)) {
    return { valid: false, error: "It's not your turn", errorCode: 'NOT_PLAYERS_TURN' };
  }

  const { gem } = action;

  // Verify gem is a valid color (not gold)
  if (!GEM_COLORS.includes(gem)) {
    return { valid: false, error: 'Cannot take gold gems with this action', errorCode: 'CANNOT_TAKE_GOLD' };
  }

  // Verify bank has at least 4 of the requested gem
  if (state.bank[gem] < GAME_CONSTANTS.MIN_GEMS_FOR_TAKE_TWO) {
    return { 
      valid: false, 
      error: `Bank must have at least ${GAME_CONSTANTS.MIN_GEMS_FOR_TAKE_TWO} ${gem} gems to take 2`, 
      errorCode: 'REQUIRES_FOUR_GEMS_FOR_TWO' 
    };
  }

  return { valid: true };
}

/**
 * Validates reserving a card
 *
 * Rules:
 * - Player may hold maximum 3 reserved cards
 * - Can reserve face-up card from market or blind draw from deck
 * - Receives 1 gold gem if available
 */
export function validateReserveCard(
  state: GameState,
  action: ReserveCardAction
): ValidationResult {
  // Verify it's the player's turn
  if (!isPlayersTurn(state, action.playerId)) {
    return { valid: false, error: "It's not your turn", errorCode: 'NOT_PLAYERS_TURN' };
  }

  const player = getPlayerById(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found', errorCode: 'INVALID_ACTION' };
  }

  // Verify player has fewer than 3 reserved cards
  if (player.reservedCards.length >= GAME_CONSTANTS.MAX_RESERVED_CARDS) {
    return { 
      valid: false, 
      error: `Cannot have more than ${GAME_CONSTANTS.MAX_RESERVED_CARDS} reserved cards`, 
      errorCode: 'MAX_RESERVED_CARDS' 
    };
  }

  // If cardId provided, verify card exists in market
  if (action.cardId !== null) {
    const card = findCardInMarket(state, action.cardId);
    if (!card) {
      return { valid: false, error: 'Card not found in market', errorCode: 'CARD_NOT_AVAILABLE' };
    }
  } else {
    // Blind draw - verify deck has cards
    const deck = getDeckByTier(state, action.tier);
    if (deck.length === 0) {
      return { valid: false, error: `No cards remaining in tier ${action.tier} deck`, errorCode: 'CARD_NOT_AVAILABLE' };
    }
  }

  return { valid: true };
}

/**
 * Validates purchasing a card
 *
 * Rules:
 * - Can purchase from market or reserved cards
 * - Cost is reduced by player's permanent bonuses
 * - Gold gems may substitute for any missing color
 */
export function validatePurchaseCard(
  state: GameState,
  action: PurchaseCardAction
): ValidationResult {
  // Verify it's the player's turn
  if (!isPlayersTurn(state, action.playerId)) {
    return { valid: false, error: "It's not your turn", errorCode: 'NOT_PLAYERS_TURN' };
  }

  const player = getPlayerById(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found', errorCode: 'INVALID_ACTION' };
  }

  // Find the card (in market or reserved)
  const card = findCardInMarket(state, action.cardId) ?? 
               player.reservedCards.find(c => c.id === action.cardId);

  if (!card) {
    return { valid: false, error: 'Card not found', errorCode: 'CARD_NOT_AVAILABLE' };
  }

  // Check if player can afford card
  if (!canAffordCard(state, action.playerId, action.cardId)) {
    return { valid: false, error: 'Cannot afford this card', errorCode: 'INSUFFICIENT_PAYMENT' };
  }

  return { valid: true };
}

/**
 * Validates selecting a noble
 *
 * Rules:
 * - Player must meet the noble's requirements
 * - Noble must be available in game
 */
export function validateSelectNoble(
  state: GameState,
  action: SelectNobleAction
): ValidationResult {
  const player = getPlayerById(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found', errorCode: 'INVALID_ACTION' };
  }

  // Verify noble exists and is available
  const noble = state.nobles.find(n => n.id === action.nobleId);
  if (!noble) {
    return { valid: false, error: 'Noble not available', errorCode: 'NOBLE_NOT_ELIGIBLE' };
  }

  // Verify player meets noble requirements
  for (const color of GEM_COLORS) {
    if (player.bonuses[color] < noble.requirements[color]) {
      return { 
        valid: false, 
        error: 'Player does not meet noble requirements', 
        errorCode: 'NOBLE_NOT_ELIGIBLE' 
      };
    }
  }

  return { valid: true };
}

/**
 * Validates discarding gems
 *
 * Rules:
 * - Player must have more than 10 gems
 * - Discard must bring total to exactly 10
 * - Can only discard gems the player has
 */
export function validateDiscardGems(
  state: GameState,
  action: DiscardGemsAction
): ValidationResult {
  const player = getPlayerById(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found', errorCode: 'INVALID_ACTION' };
  }

  const totalGems = getTotalGems(state, action.playerId);

  // Verify player has more than 10 gems
  if (totalGems <= GAME_CONSTANTS.MAX_GEMS) {
    return { valid: false, error: 'Player does not need to discard gems', errorCode: 'INVALID_ACTION' };
  }

  // Calculate total gems to discard
  let totalDiscard = 0;
  for (const [gem, count] of Object.entries(action.gems)) {
    if (count === undefined || count < 0) continue;
    totalDiscard += count;
    
    // Verify player has the gems they're discarding
    const gemType = gem as keyof typeof player.gems;
    if (player.gems[gemType] < count) {
      return { 
        valid: false, 
        error: `Cannot discard ${count} ${gem} gems - only have ${player.gems[gemType]}`, 
        errorCode: 'INVALID_DISCARD_AMOUNT' 
      };
    }
  }

  // Verify discard brings total to exactly 10
  const afterDiscard = totalGems - totalDiscard;
  if (afterDiscard !== GAME_CONSTANTS.MAX_GEMS) {
    return { 
      valid: false, 
      error: `Must discard exactly ${totalGems - GAME_CONSTANTS.MAX_GEMS} gems to get to ${GAME_CONSTANTS.MAX_GEMS}`, 
      errorCode: 'INVALID_DISCARD_AMOUNT' 
    };
  }

  return { valid: true };
}

// =============================================================================
// HELPER VALIDATION FUNCTIONS
// =============================================================================

/**
 * Checks if it's the specified player's turn
 */
export function isPlayersTurn(state: GameState, playerId: string): boolean {
  const currentPlayer = getCurrentPlayer(state);
  return currentPlayer.id === playerId;
}

/**
 * Checks if the game is in a valid playing state
 */
export function isGameInProgress(state: GameState): boolean {
  return state.phase === 'playing' || state.phase === 'final_round';
}

/**
 * Finds a card in the market by ID
 */
export function findCardInMarket(state: GameState, cardId: string): DevelopmentCard | undefined {
  return (
    state.market.tier1.find(c => c?.id === cardId) ??
    state.market.tier2.find(c => c?.id === cardId) ??
    state.market.tier3.find(c => c?.id === cardId)
  ) ?? undefined;
}

/**
 * Gets a deck by tier
 */
export function getDeckByTier(state: GameState, tier: 1 | 2 | 3): DevelopmentCard[] {
  switch (tier) {
    case 1: return state.decks.tier1;
    case 2: return state.decks.tier2;
    case 3: return state.decks.tier3;
  }
}

/**
 * Calculates the effective cost of a card after applying bonuses
 */
export function calculateEffectiveCost(
  state: GameState,
  playerId: string,
  cardId: string
): Record<GemColor, number> | null {
  const player = getPlayerById(state, playerId);
  if (!player) return null;

  // Find the card
  const card = findCardInMarket(state, cardId) ?? 
               player.reservedCards.find(c => c.id === cardId);
  if (!card) return null;

  // Calculate effective cost (subtract bonuses, minimum 0)
  const effectiveCost: Record<GemColor, number> = {
    emerald: Math.max(0, card.cost.emerald - player.bonuses.emerald),
    diamond: Math.max(0, card.cost.diamond - player.bonuses.diamond),
    sapphire: Math.max(0, card.cost.sapphire - player.bonuses.sapphire),
    onyx: Math.max(0, card.cost.onyx - player.bonuses.onyx),
    ruby: Math.max(0, card.cost.ruby - player.bonuses.ruby),
  };

  return effectiveCost;
}

/**
 * Checks if player can afford a card (with gold substitution)
 */
export function canAffordCard(
  state: GameState,
  playerId: string,
  cardId: string
): boolean {
  const player = getPlayerById(state, playerId);
  if (!player) return false;

  const effectiveCost = calculateEffectiveCost(state, playerId, cardId);
  if (!effectiveCost) return false;

  // Calculate how much gold is needed
  let goldNeeded = 0;
  for (const color of GEM_COLORS) {
    const shortfall = effectiveCost[color] - player.gems[color];
    if (shortfall > 0) {
      goldNeeded += shortfall;
    }
  }

  // Check if player has enough gold
  return player.gems.gold >= goldNeeded;
}

/**
 * Gets all nobles the player is eligible for
 */
export function getEligibleNobles(state: GameState, playerId: string): string[] {
  const player = getPlayerById(state, playerId);
  if (!player) return [];

  return state.nobles
    .filter(noble => {
      for (const color of GEM_COLORS) {
        if (player.bonuses[color] < noble.requirements[color]) {
          return false;
        }
      }
      return true;
    })
    .map(noble => noble.id);
}

/**
 * Calculates total gems a player holds
 */
export function getTotalGems(state: GameState, playerId: string): number {
  const player = getPlayerById(state, playerId);
  if (!player) return 0;

  return (
    player.gems.emerald +
    player.gems.diamond +
    player.gems.sapphire +
    player.gems.onyx +
    player.gems.ruby +
    player.gems.gold
  );
}

/**
 * Checks if player needs to discard gems
 */
export function needsToDiscardGems(state: GameState, playerId: string): boolean {
  return getTotalGems(state, playerId) > GAME_CONSTANTS.MAX_GEMS;
}
