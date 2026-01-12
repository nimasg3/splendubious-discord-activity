/**
 * Action Application (State Transitions)
 *
 * Functions to apply validated actions and produce new game states.
 * All functions should be pure and return new state objects.
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
  DevelopmentCard,
  GemColor,
  GEM_COLORS,
  GAME_CONSTANTS,
} from './types';
import { cloneGameState, getPlayerById, getCurrentPlayer } from './initialization';
import { validateAction, calculateEffectiveCost, getEligibleNobles } from './validators';

// =============================================================================
// MAIN ACTION APPLICATION
// =============================================================================

/**
 * Applies an action to the game state and returns the new state.
 * Validates the action first and throws if invalid.
 *
 * @param state - Current game state
 * @param action - Action to apply
 * @returns New game state after action
 * @throws Error if action is invalid
 */
export function applyAction(state: GameState, action: PlayerAction): GameState {
  const validation = validateAction(state, action);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid action');
  }
  return applyActionUnsafe(state, action);
}

/**
 * Applies an action without validation (for internal use after validation)
 */
export function applyActionUnsafe(state: GameState, action: PlayerAction): GameState {
  switch (action.type) {
    case 'TAKE_THREE_GEMS':
      return applyTakeThreeGems(state, action);
    case 'TAKE_TWO_GEMS':
      return applyTakeTwoGems(state, action);
    case 'RESERVE_CARD':
      return applyReserveCard(state, action);
    case 'PURCHASE_CARD':
      return applyPurchaseCard(state, action);
    case 'SELECT_NOBLE':
      return applySelectNoble(state, action);
    case 'DISCARD_GEMS':
      return applyDiscardGems(state, action);
    default:
      throw new Error('Invalid action type');
  }
}

// =============================================================================
// ACTION HANDLERS
// =============================================================================

/**
 * Applies taking 3 different gems
 */
export function applyTakeThreeGems(
  state: GameState,
  action: TakeThreeGemsAction
): GameState {
  const newState = cloneGameState(state);
  const player = getPlayerById(newState, action.playerId)!;
  
  // Remove gems from bank and add to player
  for (const gem of action.gems) {
    newState.bank[gem]--;
    player.gems[gem]++;
  }

  // Check for noble eligibility and advance turn
  return finishTurn(newState, action.playerId);
}

/**
 * Applies taking 2 gems of the same color
 */
export function applyTakeTwoGems(
  state: GameState,
  action: TakeTwoGemsAction
): GameState {
  const newState = cloneGameState(state);
  const player = getPlayerById(newState, action.playerId)!;
  
  // Remove 2 gems from bank and add to player
  newState.bank[action.gem] -= 2;
  player.gems[action.gem] += 2;

  // Check for noble eligibility and advance turn
  return finishTurn(newState, action.playerId);
}

/**
 * Applies reserving a card
 */
export function applyReserveCard(
  state: GameState,
  action: ReserveCardAction
): GameState {
  const newState = cloneGameState(state);
  const player = getPlayerById(newState, action.playerId)!;
  
  let card: DevelopmentCard | undefined;
  
  if (action.cardId !== null) {
    // Reserve from market
    card = removeCardFromMarket(newState, action.cardId);
    if (card) {
      // Refill market from deck
      refillMarketSlot(newState, card.tier);
    }
  } else {
    // Blind draw from deck
    const deck = getDeckByTierMutable(newState, action.tier);
    if (deck.length > 0) {
      card = deck.shift();
    }
  }

  if (card) {
    player.reservedCards.push(card);
  }

  // Give player gold gem if available
  if (newState.bank.gold > 0) {
    newState.bank.gold--;
    player.gems.gold++;
  }

  // Check for noble eligibility and advance turn
  return finishTurn(newState, action.playerId);
}

/**
 * Applies purchasing a card
 */
export function applyPurchaseCard(
  state: GameState,
  action: PurchaseCardAction
): GameState {
  const newState = cloneGameState(state);
  const player = getPlayerById(newState, action.playerId)!;
  
  // Calculate payment BEFORE removing the card (so we can find it)
  const payment = calculatePayment(newState, action.playerId, action.cardId);
  if (!payment) {
    throw new Error('Cannot afford card');
  }

  // Find and remove the card
  let card = removeCardFromMarket(newState, action.cardId);
  let fromReserved = false;
  
  if (!card) {
    // Try reserved cards
    const reservedIndex = player.reservedCards.findIndex(c => c.id === action.cardId);
    if (reservedIndex !== -1) {
      card = player.reservedCards.splice(reservedIndex, 1)[0];
      fromReserved = true;
    }
  }

  if (!card) {
    throw new Error('Card not found');
  }

  // Remove gems from player, add to bank
  for (const color of GEM_COLORS) {
    player.gems[color] -= payment.gems[color];
    newState.bank[color] += payment.gems[color];
  }
  player.gems.gold -= payment.gold;
  newState.bank.gold += payment.gold;

  // Add card to player's purchased cards
  player.purchasedCards.push(card);

  // Update player's bonuses
  player.bonuses[card.bonus]++;

  // Update player's prestige points
  player.prestigePoints += card.prestigePoints;

  // Refill market if card was from market
  if (!fromReserved) {
    refillMarketSlot(newState, card.tier);
  }

  // Check for noble eligibility and advance turn
  return finishTurn(newState, action.playerId);
}

/**
 * Applies selecting a noble
 */
export function applySelectNoble(
  state: GameState,
  action: SelectNobleAction
): GameState {
  const newState = cloneGameState(state);
  const player = getPlayerById(newState, action.playerId)!;
  
  // Find and remove noble from available nobles
  const nobleIndex = newState.nobles.findIndex(n => n.id === action.nobleId);
  if (nobleIndex === -1) {
    throw new Error('Noble not found');
  }
  
  const [noble] = newState.nobles.splice(nobleIndex, 1);
  
  // Add noble to player (noble is guaranteed to exist since we checked index)
  player.nobles.push(noble!);
  
  // Update player's prestige points
  player.prestigePoints += noble!.prestigePoints;

  // Clear waiting for noble selection flag
  newState.pendingNobleSelection = undefined;

  // Check game end and advance turn
  return checkGameEndAndAdvance(newState);
}

/**
 * Applies discarding gems
 */
export function applyDiscardGems(
  state: GameState,
  action: DiscardGemsAction
): GameState {
  const newState = cloneGameState(state);
  const player = getPlayerById(newState, action.playerId)!;
  
  // Remove gems from player and add to bank
  for (const [gem, count] of Object.entries(action.gems)) {
    if (count === undefined || count <= 0) continue;
    const gemType = gem as keyof typeof player.gems;
    player.gems[gemType] -= count;
    newState.bank[gemType] += count;
  }

  // Clear pending discard flag
  newState.pendingGemDiscard = undefined;

  // Continue with noble check and turn advancement
  return checkNobleAndAdvance(newState, action.playerId);
}

// =============================================================================
// TURN MANAGEMENT
// =============================================================================

/**
 * Common end-of-turn logic: check gem limit, nobles, game end, advance turn
 */
function finishTurn(state: GameState, playerId: string): GameState {
  // First check if player needs to discard gems
  const player = getPlayerById(state, playerId)!;
  const totalGems = 
    player.gems.emerald + player.gems.diamond + player.gems.sapphire + 
    player.gems.onyx + player.gems.ruby + player.gems.gold;
  
  if (totalGems > GAME_CONSTANTS.MAX_GEMS) {
    state.pendingGemDiscard = playerId;
    return state;
  }

  return checkNobleAndAdvance(state, playerId);
}

/**
 * Check noble eligibility after gem discard is resolved
 */
function checkNobleAndAdvance(state: GameState, playerId: string): GameState {
  // Check for noble eligibility
  const eligibleNobleIds = getEligibleNobles(state, playerId);
  
  if (eligibleNobleIds.length === 1) {
    // Auto-acquire single noble
    const nobleId = eligibleNobleIds[0];
    const nobleIndex = state.nobles.findIndex(n => n.id === nobleId);
    const [noble] = state.nobles.splice(nobleIndex, 1);
    const player = getPlayerById(state, playerId)!;
    player.nobles.push(noble!);
    player.prestigePoints += noble!.prestigePoints;
  } else if (eligibleNobleIds.length > 1) {
    // Wait for player to select noble
    state.pendingNobleSelection = playerId;
    return state;
  }

  return checkGameEndAndAdvance(state);
}

/**
 * Check game end condition and advance turn
 */
function checkGameEndAndAdvance(state: GameState): GameState {
  state = checkGameEndTrigger(state);
  return advanceTurn(state);
}

/**
 * Advances to the next player's turn
 */
export function advanceTurn(state: GameState): GameState {
  // Check if game already ended
  if (state.phase === 'ended') {
    return state;
  }

  // Advance to next player
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  
  // If we wrapped back to first player, increment round
  if (state.currentPlayerIndex === 0) {
    state.round++;
    
    // Check if game ends (final round complete)
    if (state.phase === 'final_round') {
      state = checkGameEnd(state);
    }
  }

  return state;
}

/**
 * Checks and applies noble acquisition at end of turn
 * If multiple nobles are eligible, state awaits player selection
 */
export function checkNobleAcquisition(state: GameState): GameState {
  const currentPlayer = getCurrentPlayer(state);
  const eligibleNobleIds = getEligibleNobles(state, currentPlayer.id);
  
  if (eligibleNobleIds.length === 0) {
    return state;
  }
  
  if (eligibleNobleIds.length === 1) {
    // Auto-acquire single noble
    const nobleId = eligibleNobleIds[0];
    const nobleIndex = state.nobles.findIndex(n => n.id === nobleId);
    const [noble] = state.nobles.splice(nobleIndex, 1);
    currentPlayer.nobles.push(noble!);
    currentPlayer.prestigePoints += noble!.prestigePoints;
    return state;
  }
  
  // Multiple nobles - wait for player selection
  state.pendingNobleSelection = currentPlayer.id;
  return state;
}

/**
 * Refills the market from deck after a card is taken
 */
export function refillMarket(state: GameState, tier: 1 | 2 | 3): GameState {
  const newState = cloneGameState(state);
  refillMarketSlot(newState, tier);
  return newState;
}

// =============================================================================
// GAME END DETECTION
// =============================================================================

/**
 * Checks if the game end has been triggered
 */
export function checkGameEndTrigger(state: GameState): GameState {
  // Already triggered
  if (state.phase === 'final_round' || state.phase === 'ended') {
    return state;
  }

  // Check if any player has 15+ prestige points
  for (const player of state.players) {
    if (player.prestigePoints >= GAME_CONSTANTS.WINNING_POINTS) {
      state.endGameTriggeredBy = player.id;
      state.phase = 'final_round';
      return state;
    }
  }

  return state;
}

/**
 * Checks if the game has ended (all players had equal turns after trigger)
 */
export function checkGameEnd(state: GameState): GameState {
  // Not in final round
  if (state.phase !== 'final_round') {
    return state;
  }

  // Round complete - game ends
  state.phase = 'ended';
  state.winners = determineWinners(state);
  return state;
}

/**
 * Determines the winner(s) of a completed game
 *
 * Tiebreaker rules:
 * 1. Highest prestige points
 * 2. Fewest purchased cards
 * 3. If still tied, shared victory
 */
export function determineWinners(state: GameState): string[] {
  if (state.players.length === 0) {
    return [];
  }

  // Find max prestige points
  const maxPoints = Math.max(...state.players.map(p => p.prestigePoints));
  
  // Filter players with max points
  let candidates = state.players.filter(p => p.prestigePoints === maxPoints);
  
  if (candidates.length === 1) {
    return [candidates[0]!.id];
  }

  // Tiebreaker: fewest purchased cards
  const minCards = Math.min(...candidates.map(p => p.purchasedCards.length));
  candidates = candidates.filter(p => p.purchasedCards.length === minCards);

  // Return all tied winners
  return candidates.map(p => p.id);
}

// =============================================================================
// PAYMENT CALCULATION
// =============================================================================

/**
 * Calculates how to pay for a card (which gems and gold to use)
 */
export function calculatePayment(
  state: GameState,
  playerId: string,
  cardId: string
): { gems: Record<GemColor, number>; gold: number } | null {
  const player = getPlayerById(state, playerId);
  if (!player) return null;

  const effectiveCost = calculateEffectiveCost(state, playerId, cardId);
  if (!effectiveCost) return null;

  const payment: Record<GemColor, number> = {
    emerald: 0,
    diamond: 0,
    sapphire: 0,
    onyx: 0,
    ruby: 0,
  };
  let goldNeeded = 0;

  // Calculate payment for each color
  for (const color of GEM_COLORS) {
    const required = effectiveCost[color];
    const available = player.gems[color];
    
    if (required <= available) {
      payment[color] = required;
    } else {
      payment[color] = available;
      goldNeeded += required - available;
    }
  }

  // Check if player has enough gold
  if (goldNeeded > player.gems.gold) {
    return null;
  }

  return { gems: payment, gold: goldNeeded };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Removes a card from the market by ID (mutates state)
 * Sets the slot to null instead of removing to preserve positions
 */
function removeCardFromMarket(state: GameState, cardId: string): DevelopmentCard | undefined {
  for (const tierKey of ['tier1', 'tier2', 'tier3'] as const) {
    const market = state.market[tierKey];
    const index = market.findIndex(c => c?.id === cardId);
    if (index !== -1) {
      const card = market[index]!;
      market[index] = null;
      return card;
    }
  }
  return undefined;
}

/**
 * Refills a market slot from the deck (mutates state)
 * Fills the first null slot in the market
 */
function refillMarketSlot(state: GameState, tier: 1 | 2 | 3): void {
  const deck = getDeckByTierMutable(state, tier);
  const market = getMarketByTierMutable(state, tier);
  
  // Find the first null slot
  const emptyIndex = market.findIndex(c => c === null);
  
  if (deck.length > 0 && emptyIndex !== -1) {
    const card = deck.shift()!;
    market[emptyIndex] = card;
  }
}

/**
 * Gets the deck array for a tier (mutable reference)
 */
function getDeckByTierMutable(state: GameState, tier: 1 | 2 | 3): DevelopmentCard[] {
  switch (tier) {
    case 1: return state.decks.tier1;
    case 2: return state.decks.tier2;
    case 3: return state.decks.tier3;
  }
}

/**
 * Gets the market array for a tier (mutable reference)
 */
function getMarketByTierMutable(state: GameState, tier: 1 | 2 | 3): (DevelopmentCard | null)[] {
  switch (tier) {
    case 1: return state.market.tier1;
    case 2: return state.market.tier2;
    case 3: return state.market.tier3;
  }
}
