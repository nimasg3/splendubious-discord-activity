/**
 * Game Initialization
 *
 * Functions for creating and setting up new games.
 */

import {
  GameState,
  GameConfig,
  Player,
  GemCollection,
  CardMarket,
  CardDecks,
  Noble,
  GemColor,
  INITIAL_GEM_COUNTS,
  GAME_CONSTANTS,
} from './types.js';
import { getCardsByTier, getAllNobles } from './data/index.js';

// =============================================================================
// INITIALIZATION FUNCTIONS
// =============================================================================

/**
 * Creates an empty gem collection
 */
export function createEmptyGemCollection(): GemCollection {
  return {
    emerald: 0,
    diamond: 0,
    sapphire: 0,
    onyx: 0,
    ruby: 0,
    gold: 0,
  };
}

/**
 * Creates an empty colored gem collection
 */
export function createEmptyColoredGemCollection(): Record<GemColor, number> {
  return {
    emerald: 0,
    diamond: 0,
    sapphire: 0,
    onyx: 0,
    ruby: 0,
  };
}

/**
 * Creates the initial bank gem supply based on player count
 */
export function createInitialBank(playerCount: 2 | 3 | 4): GemCollection {
  const counts = INITIAL_GEM_COUNTS[playerCount];
  return {
    emerald: counts.colored,
    diamond: counts.colored,
    sapphire: counts.colored,
    onyx: counts.colored,
    ruby: counts.colored,
    gold: counts.gold,
  };
}

/**
 * Creates a new player with initial state
 */
export function createPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    gems: createEmptyGemCollection(),
    bonuses: createEmptyColoredGemCollection(),
    reservedCards: [],
    purchasedCards: [],
    nobles: [],
    prestigePoints: 0,
  };
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * Optionally accepts a random function for deterministic testing
 */
export function shuffleArray<T>(array: T[], randomFn: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Creates and shuffles the card decks
 */
export function createShuffledDecks(randomFn?: () => number): CardDecks {
  return {
    tier1: shuffleArray(getCardsByTier(1), randomFn),
    tier2: shuffleArray(getCardsByTier(2), randomFn),
    tier3: shuffleArray(getCardsByTier(3), randomFn),
  };
}

/**
 * Creates the initial market from decks (reveals top 4 cards per tier)
 */
export function createInitialMarket(decks: CardDecks): { market: CardMarket; remainingDecks: CardDecks } {
  const marketSize = GAME_CONSTANTS.MARKET_SIZE;
  
  return {
    market: {
      tier1: decks.tier1.slice(0, marketSize),
      tier2: decks.tier2.slice(0, marketSize),
      tier3: decks.tier3.slice(0, marketSize),
    },
    remainingDecks: {
      tier1: decks.tier1.slice(marketSize),
      tier2: decks.tier2.slice(marketSize),
      tier3: decks.tier3.slice(marketSize),
    },
  };
}

/**
 * Selects nobles for the game based on player count
 */
export function selectNobles(playerCount: 2 | 3 | 4, randomFn?: () => number): Noble[] {
  const allNobles = getAllNobles();
  const shuffled = shuffleArray(allNobles, randomFn);
  return shuffled.slice(0, playerCount + 1);
}

/**
 * Randomizes player turn order
 */
export function randomizePlayerOrder(players: Player[], randomFn?: () => number): Player[] {
  return shuffleArray(players, randomFn);
}

/**
 * Generates a unique game ID
 */
export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a new game with the given configuration and players
 */
export function createGame(
  config: GameConfig,
  playerInfos: Array<{ id: string; name: string }>,
  randomFn?: () => number
): GameState {
  // Validate player count
  if (playerInfos.length !== config.playerCount) {
    throw new Error(`Expected ${config.playerCount} players, got ${playerInfos.length}`);
  }

  // Create players
  const players = playerInfos.map((info) => createPlayer(info.id, info.name));

  // Randomize player order
  const orderedPlayers = randomizePlayerOrder(players, randomFn);

  // Create initial bank
  const bank = createInitialBank(config.playerCount);

  // Create and shuffle decks
  const shuffledDecks = createShuffledDecks(randomFn);

  // Create initial market
  const { market, remainingDecks } = createInitialMarket(shuffledDecks);

  // Select nobles
  const nobles = selectNobles(config.playerCount, randomFn);

  return {
    id: generateGameId(),
    phase: 'playing',
    players: orderedPlayers,
    currentPlayerIndex: 0,
    bank,
    market,
    decks: remainingDecks,
    nobles,
    round: 1,
    endGameTriggeredBy: undefined,
    winners: [],
    pendingGemDiscard: undefined,
    pendingNobleSelection: undefined,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Deep clones a game state for immutable operations
 */
export function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Gets the current player from game state
 */
export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]!;
}

/**
 * Gets a player by ID
 */
export function getPlayerById(state: GameState, playerId: string): Player | undefined {
  return state.players.find((p) => p.id === playerId);
}
