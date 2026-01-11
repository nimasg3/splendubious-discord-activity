/**
 * Splendor Game Data
 *
 * This file contains all development cards and nobles for the game.
 * Card data is based on the original Splendor board game.
 */

import { DevelopmentCard, Noble, ColoredGemCollection } from '../types';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates an empty gem collection with all zeros
 */
function emptyGems(): ColoredGemCollection {
  return {
    emerald: 0,
    diamond: 0,
    sapphire: 0,
    onyx: 0,
    ruby: 0,
  };
}

/**
 * Creates a gem cost from partial input
 */
function cost(gems: Partial<ColoredGemCollection>): ColoredGemCollection {
  return { ...emptyGems(), ...gems };
}

// =============================================================================
// TIER 1 DEVELOPMENT CARDS (40 cards)
// =============================================================================

export const TIER_1_CARDS: DevelopmentCard[] = [
  // Diamond bonus cards (8 cards)
  { id: 't1_d01', tier: 1, cost: cost({ sapphire: 1, emerald: 1, ruby: 1, onyx: 1 }), bonus: 'diamond', prestigePoints: 0 },
  { id: 't1_d02', tier: 1, cost: cost({ sapphire: 1, emerald: 2, ruby: 1, onyx: 1 }), bonus: 'diamond', prestigePoints: 0 },
  { id: 't1_d03', tier: 1, cost: cost({ sapphire: 2, emerald: 2, onyx: 1 }), bonus: 'diamond', prestigePoints: 0 },
  { id: 't1_d04', tier: 1, cost: cost({ emerald: 3, ruby: 1, onyx: 1 }), bonus: 'diamond', prestigePoints: 0 },
  { id: 't1_d05', tier: 1, cost: cost({ sapphire: 3 }), bonus: 'diamond', prestigePoints: 0 },
  { id: 't1_d06', tier: 1, cost: cost({ sapphire: 2, onyx: 2 }), bonus: 'diamond', prestigePoints: 0 },
  { id: 't1_d07', tier: 1, cost: cost({ sapphire: 2, emerald: 2, ruby: 1 }), bonus: 'diamond', prestigePoints: 0 },
  { id: 't1_d08', tier: 1, cost: cost({ onyx: 4 }), bonus: 'diamond', prestigePoints: 1 },

  // Sapphire bonus cards (8 cards)
  { id: 't1_s01', tier: 1, cost: cost({ diamond: 1, emerald: 1, ruby: 1, onyx: 1 }), bonus: 'sapphire', prestigePoints: 0 },
  { id: 't1_s02', tier: 1, cost: cost({ diamond: 1, emerald: 1, ruby: 2, onyx: 1 }), bonus: 'sapphire', prestigePoints: 0 },
  { id: 't1_s03', tier: 1, cost: cost({ diamond: 1, emerald: 2, ruby: 2 }), bonus: 'sapphire', prestigePoints: 0 },
  { id: 't1_s04', tier: 1, cost: cost({ diamond: 1, emerald: 3, ruby: 1 }), bonus: 'sapphire', prestigePoints: 0 },
  { id: 't1_s05', tier: 1, cost: cost({ onyx: 3 }), bonus: 'sapphire', prestigePoints: 0 },
  { id: 't1_s06', tier: 1, cost: cost({ emerald: 2, onyx: 2 }), bonus: 'sapphire', prestigePoints: 0 },
  { id: 't1_s07', tier: 1, cost: cost({ diamond: 1, onyx: 2, emerald: 2 }), bonus: 'sapphire', prestigePoints: 0 },
  { id: 't1_s08', tier: 1, cost: cost({ ruby: 4 }), bonus: 'sapphire', prestigePoints: 1 },

  // Emerald bonus cards (8 cards)
  { id: 't1_e01', tier: 1, cost: cost({ diamond: 1, sapphire: 1, ruby: 1, onyx: 1 }), bonus: 'emerald', prestigePoints: 0 },
  { id: 't1_e02', tier: 1, cost: cost({ diamond: 1, sapphire: 1, ruby: 1, onyx: 2 }), bonus: 'emerald', prestigePoints: 0 },
  { id: 't1_e03', tier: 1, cost: cost({ sapphire: 1, ruby: 2, onyx: 2 }), bonus: 'emerald', prestigePoints: 0 },
  { id: 't1_e04', tier: 1, cost: cost({ diamond: 1, sapphire: 3, emerald: 1 }), bonus: 'emerald', prestigePoints: 0 },
  { id: 't1_e05', tier: 1, cost: cost({ ruby: 3 }), bonus: 'emerald', prestigePoints: 0 },
  { id: 't1_e06', tier: 1, cost: cost({ sapphire: 2, ruby: 2 }), bonus: 'emerald', prestigePoints: 0 },
  { id: 't1_e07', tier: 1, cost: cost({ diamond: 2, sapphire: 1, onyx: 2 }), bonus: 'emerald', prestigePoints: 0 },
  { id: 't1_e08', tier: 1, cost: cost({ sapphire: 4 }), bonus: 'emerald', prestigePoints: 1 },

  // Ruby bonus cards (8 cards)
  { id: 't1_r01', tier: 1, cost: cost({ diamond: 1, sapphire: 1, emerald: 1, onyx: 1 }), bonus: 'ruby', prestigePoints: 0 },
  { id: 't1_r02', tier: 1, cost: cost({ diamond: 2, sapphire: 1, emerald: 1, onyx: 1 }), bonus: 'ruby', prestigePoints: 0 },
  { id: 't1_r03', tier: 1, cost: cost({ diamond: 2, emerald: 1, onyx: 2 }), bonus: 'ruby', prestigePoints: 0 },
  { id: 't1_r04', tier: 1, cost: cost({ diamond: 1, ruby: 1, onyx: 3 }), bonus: 'ruby', prestigePoints: 0 },
  { id: 't1_r05', tier: 1, cost: cost({ diamond: 3 }), bonus: 'ruby', prestigePoints: 0 },
  { id: 't1_r06', tier: 1, cost: cost({ diamond: 2, emerald: 2 }), bonus: 'ruby', prestigePoints: 0 },
  { id: 't1_r07', tier: 1, cost: cost({ diamond: 2, sapphire: 2, emerald: 1 }), bonus: 'ruby', prestigePoints: 0 },
  { id: 't1_r08', tier: 1, cost: cost({ emerald: 4 }), bonus: 'ruby', prestigePoints: 1 },

  // Onyx bonus cards (8 cards)
  { id: 't1_o01', tier: 1, cost: cost({ diamond: 1, sapphire: 1, emerald: 1, ruby: 1 }), bonus: 'onyx', prestigePoints: 0 },
  { id: 't1_o02', tier: 1, cost: cost({ diamond: 1, sapphire: 2, emerald: 1, ruby: 1 }), bonus: 'onyx', prestigePoints: 0 },
  { id: 't1_o03', tier: 1, cost: cost({ diamond: 2, sapphire: 2, ruby: 1 }), bonus: 'onyx', prestigePoints: 0 },
  { id: 't1_o04', tier: 1, cost: cost({ sapphire: 1, emerald: 3, ruby: 1 }), bonus: 'onyx', prestigePoints: 0 },
  { id: 't1_o05', tier: 1, cost: cost({ emerald: 3 }), bonus: 'onyx', prestigePoints: 0 },
  { id: 't1_o06', tier: 1, cost: cost({ diamond: 2, ruby: 2 }), bonus: 'onyx', prestigePoints: 0 },
  { id: 't1_o07', tier: 1, cost: cost({ emerald: 2, ruby: 1, onyx: 2 }), bonus: 'onyx', prestigePoints: 0 },
  { id: 't1_o08', tier: 1, cost: cost({ diamond: 4 }), bonus: 'onyx', prestigePoints: 1 },
];

// =============================================================================
// TIER 2 DEVELOPMENT CARDS (30 cards)
// =============================================================================

export const TIER_2_CARDS: DevelopmentCard[] = [
  // Diamond bonus cards (6 cards)
  { id: 't2_d01', tier: 2, cost: cost({ emerald: 3, sapphire: 2, onyx: 2 }), bonus: 'diamond', prestigePoints: 1 },
  { id: 't2_d02', tier: 2, cost: cost({ emerald: 2, ruby: 3, onyx: 3 }), bonus: 'diamond', prestigePoints: 1 },
  { id: 't2_d03', tier: 2, cost: cost({ diamond: 5, sapphire: 3 }), bonus: 'diamond', prestigePoints: 2 },
  { id: 't2_d04', tier: 2, cost: cost({ ruby: 5 }), bonus: 'diamond', prestigePoints: 2 },
  { id: 't2_d05', tier: 2, cost: cost({ ruby: 5, onyx: 3 }), bonus: 'diamond', prestigePoints: 2 },
  { id: 't2_d06', tier: 2, cost: cost({ ruby: 6 }), bonus: 'diamond', prestigePoints: 3 },

  // Sapphire bonus cards (6 cards)
  { id: 't2_s01', tier: 2, cost: cost({ diamond: 2, emerald: 2, ruby: 3 }), bonus: 'sapphire', prestigePoints: 1 },
  { id: 't2_s02', tier: 2, cost: cost({ diamond: 3, emerald: 3, onyx: 2 }), bonus: 'sapphire', prestigePoints: 1 },
  { id: 't2_s03', tier: 2, cost: cost({ sapphire: 5, emerald: 3 }), bonus: 'sapphire', prestigePoints: 2 },
  { id: 't2_s04', tier: 2, cost: cost({ diamond: 5 }), bonus: 'sapphire', prestigePoints: 2 },
  { id: 't2_s05', tier: 2, cost: cost({ diamond: 5, emerald: 3 }), bonus: 'sapphire', prestigePoints: 2 },
  { id: 't2_s06', tier: 2, cost: cost({ diamond: 6 }), bonus: 'sapphire', prestigePoints: 3 },

  // Emerald bonus cards (6 cards)
  { id: 't2_e01', tier: 2, cost: cost({ diamond: 2, sapphire: 3, onyx: 2 }), bonus: 'emerald', prestigePoints: 1 },
  { id: 't2_e02', tier: 2, cost: cost({ diamond: 3, sapphire: 2, ruby: 3 }), bonus: 'emerald', prestigePoints: 1 },
  { id: 't2_e03', tier: 2, cost: cost({ emerald: 5, ruby: 3 }), bonus: 'emerald', prestigePoints: 2 },
  { id: 't2_e04', tier: 2, cost: cost({ sapphire: 5 }), bonus: 'emerald', prestigePoints: 2 },
  { id: 't2_e05', tier: 2, cost: cost({ sapphire: 5, ruby: 3 }), bonus: 'emerald', prestigePoints: 2 },
  { id: 't2_e06', tier: 2, cost: cost({ sapphire: 6 }), bonus: 'emerald', prestigePoints: 3 },

  // Ruby bonus cards (6 cards)
  { id: 't2_r01', tier: 2, cost: cost({ sapphire: 2, emerald: 3, onyx: 3 }), bonus: 'ruby', prestigePoints: 1 },
  { id: 't2_r02', tier: 2, cost: cost({ diamond: 2, sapphire: 2, onyx: 3 }), bonus: 'ruby', prestigePoints: 1 },
  { id: 't2_r03', tier: 2, cost: cost({ diamond: 3, ruby: 5 }), bonus: 'ruby', prestigePoints: 2 },
  { id: 't2_r04', tier: 2, cost: cost({ onyx: 5 }), bonus: 'ruby', prestigePoints: 2 },
  { id: 't2_r05', tier: 2, cost: cost({ diamond: 3, onyx: 5 }), bonus: 'ruby', prestigePoints: 2 },
  { id: 't2_r06', tier: 2, cost: cost({ onyx: 6 }), bonus: 'ruby', prestigePoints: 3 },

  // Onyx bonus cards (6 cards)
  { id: 't2_o01', tier: 2, cost: cost({ diamond: 3, sapphire: 3, ruby: 2 }), bonus: 'onyx', prestigePoints: 1 },
  { id: 't2_o02', tier: 2, cost: cost({ sapphire: 3, emerald: 2, ruby: 2 }), bonus: 'onyx', prestigePoints: 1 },
  { id: 't2_o03', tier: 2, cost: cost({ emerald: 3, onyx: 5 }), bonus: 'onyx', prestigePoints: 2 },
  { id: 't2_o04', tier: 2, cost: cost({ emerald: 5 }), bonus: 'onyx', prestigePoints: 2 },
  { id: 't2_o05', tier: 2, cost: cost({ diamond: 3, emerald: 5 }), bonus: 'onyx', prestigePoints: 2 },
  { id: 't2_o06', tier: 2, cost: cost({ emerald: 6 }), bonus: 'onyx', prestigePoints: 3 },
];

// =============================================================================
// TIER 3 DEVELOPMENT CARDS (20 cards)
// =============================================================================

export const TIER_3_CARDS: DevelopmentCard[] = [
  // Diamond bonus cards (4 cards)
  { id: 't3_d01', tier: 3, cost: cost({ emerald: 3, ruby: 3, onyx: 5, sapphire: 3 }), bonus: 'diamond', prestigePoints: 3 },
  { id: 't3_d02', tier: 3, cost: cost({ onyx: 7 }), bonus: 'diamond', prestigePoints: 4 },
  { id: 't3_d03', tier: 3, cost: cost({ onyx: 7, diamond: 3 }), bonus: 'diamond', prestigePoints: 4 },
  { id: 't3_d04', tier: 3, cost: cost({ onyx: 7, ruby: 3 }), bonus: 'diamond', prestigePoints: 5 },

  // Sapphire bonus cards (4 cards)
  { id: 't3_s01', tier: 3, cost: cost({ diamond: 3, emerald: 3, ruby: 5, onyx: 3 }), bonus: 'sapphire', prestigePoints: 3 },
  { id: 't3_s02', tier: 3, cost: cost({ diamond: 7 }), bonus: 'sapphire', prestigePoints: 4 },
  { id: 't3_s03', tier: 3, cost: cost({ diamond: 7, sapphire: 3 }), bonus: 'sapphire', prestigePoints: 4 },
  { id: 't3_s04', tier: 3, cost: cost({ diamond: 7, onyx: 3 }), bonus: 'sapphire', prestigePoints: 5 },

  // Emerald bonus cards (4 cards)
  { id: 't3_e01', tier: 3, cost: cost({ diamond: 3, sapphire: 5, ruby: 3, onyx: 3 }), bonus: 'emerald', prestigePoints: 3 },
  { id: 't3_e02', tier: 3, cost: cost({ sapphire: 7 }), bonus: 'emerald', prestigePoints: 4 },
  { id: 't3_e03', tier: 3, cost: cost({ sapphire: 7, emerald: 3 }), bonus: 'emerald', prestigePoints: 4 },
  { id: 't3_e04', tier: 3, cost: cost({ sapphire: 7, diamond: 3 }), bonus: 'emerald', prestigePoints: 5 },

  // Ruby bonus cards (4 cards)
  { id: 't3_r01', tier: 3, cost: cost({ diamond: 5, sapphire: 3, emerald: 3, onyx: 3 }), bonus: 'ruby', prestigePoints: 3 },
  { id: 't3_r02', tier: 3, cost: cost({ emerald: 7 }), bonus: 'ruby', prestigePoints: 4 },
  { id: 't3_r03', tier: 3, cost: cost({ emerald: 7, ruby: 3 }), bonus: 'ruby', prestigePoints: 4 },
  { id: 't3_r04', tier: 3, cost: cost({ emerald: 7, sapphire: 3 }), bonus: 'ruby', prestigePoints: 5 },

  // Onyx bonus cards (4 cards)
  { id: 't3_o01', tier: 3, cost: cost({ diamond: 3, sapphire: 3, emerald: 5, ruby: 3 }), bonus: 'onyx', prestigePoints: 3 },
  { id: 't3_o02', tier: 3, cost: cost({ ruby: 7 }), bonus: 'onyx', prestigePoints: 4 },
  { id: 't3_o03', tier: 3, cost: cost({ ruby: 7, onyx: 3 }), bonus: 'onyx', prestigePoints: 4 },
  { id: 't3_o04', tier: 3, cost: cost({ ruby: 7, emerald: 3 }), bonus: 'onyx', prestigePoints: 5 },
];

// =============================================================================
// NOBLES (10 nobles)
// =============================================================================

export const NOBLES: Noble[] = [
  // 4+4 requirement nobles (4 nobles)
  { id: 'noble_01', requirements: cost({ diamond: 4, onyx: 4 }), prestigePoints: 3 },
  { id: 'noble_02', requirements: cost({ sapphire: 4, emerald: 4 }), prestigePoints: 3 },
  { id: 'noble_03', requirements: cost({ emerald: 4, ruby: 4 }), prestigePoints: 3 },
  { id: 'noble_04', requirements: cost({ onyx: 4, ruby: 4 }), prestigePoints: 3 },

  // 3+3+3 requirement nobles (6 nobles)
  { id: 'noble_05', requirements: cost({ diamond: 3, sapphire: 3, onyx: 3 }), prestigePoints: 3 },
  { id: 'noble_06', requirements: cost({ diamond: 3, sapphire: 3, emerald: 3 }), prestigePoints: 3 },
  { id: 'noble_07', requirements: cost({ sapphire: 3, emerald: 3, ruby: 3 }), prestigePoints: 3 },
  { id: 'noble_08', requirements: cost({ emerald: 3, ruby: 3, onyx: 3 }), prestigePoints: 3 },
  { id: 'noble_09', requirements: cost({ diamond: 3, ruby: 3, onyx: 3 }), prestigePoints: 3 },
  { id: 'noble_10', requirements: cost({ diamond: 3, emerald: 3, onyx: 3 }), prestigePoints: 3 },
];

// =============================================================================
// DATA ACCESS FUNCTIONS
// =============================================================================

/**
 * Get all development cards
 */
export function getAllCards(): DevelopmentCard[] {
  return [...TIER_1_CARDS, ...TIER_2_CARDS, ...TIER_3_CARDS];
}

/**
 * Get cards by tier
 */
export function getCardsByTier(tier: 1 | 2 | 3): DevelopmentCard[] {
  switch (tier) {
    case 1:
      return [...TIER_1_CARDS];
    case 2:
      return [...TIER_2_CARDS];
    case 3:
      return [...TIER_3_CARDS];
  }
}

/**
 * Get all nobles
 */
export function getAllNobles(): Noble[] {
  return [...NOBLES];
}

/**
 * Find a card by ID
 */
export function findCardById(id: string): DevelopmentCard | undefined {
  return getAllCards().find((card) => card.id === id);
}

/**
 * Find a noble by ID
 */
export function findNobleById(id: string): Noble | undefined {
  return NOBLES.find((noble) => noble.id === id);
}
