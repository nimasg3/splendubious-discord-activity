import { describe, it, expect } from 'vitest';
import {
  createInitialBank,
  createPlayer,
  shuffleArray,
  createShuffledDecks,
  createInitialMarket,
  selectNobles,
  createGame,
  cloneGameState,
  getCurrentPlayer,
  getPlayerById,
} from '../initialization';
import { GameConfig, GAME_CONSTANTS, GEM_COLORS } from '../types';

describe('createInitialBank', () => {
  it('should create bank with correct gem count for 2 players', () => {
    const bank = createInitialBank(2);
    for (const color of GEM_COLORS) {
      expect(bank[color]).toBe(4);
    }
    expect(bank.gold).toBe(5); // Always 5 gold tokens
  });

  it('should create bank with correct gem count for 3 players', () => {
    const bank = createInitialBank(3);
    for (const color of GEM_COLORS) {
      expect(bank[color]).toBe(5);
    }
    expect(bank.gold).toBe(5);
  });

  it('should create bank with correct gem count for 4 players', () => {
    const bank = createInitialBank(4);
    for (const color of GEM_COLORS) {
      expect(bank[color]).toBe(7);
    }
    expect(bank.gold).toBe(5);
  });
});

describe('createPlayer', () => {
  it('should create a player with empty starting state', () => {
    const player = createPlayer('p1', 'Alice');
    
    expect(player.id).toBe('p1');
    expect(player.name).toBe('Alice');
    expect(player.prestigePoints).toBe(0);
    expect(player.purchasedCards).toEqual([]);
    expect(player.reservedCards).toEqual([]);
    expect(player.nobles).toEqual([]);
    
    // All gems should be 0
    expect(player.gems.emerald).toBe(0);
    expect(player.gems.diamond).toBe(0);
    expect(player.gems.sapphire).toBe(0);
    expect(player.gems.onyx).toBe(0);
    expect(player.gems.ruby).toBe(0);
    expect(player.gems.gold).toBe(0);
    
    // All bonuses should be 0
    expect(player.bonuses.emerald).toBe(0);
    expect(player.bonuses.diamond).toBe(0);
    expect(player.bonuses.sapphire).toBe(0);
    expect(player.bonuses.onyx).toBe(0);
    expect(player.bonuses.ruby).toBe(0);
  });
});

describe('shuffleArray', () => {
  it('should return an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.length).toBe(arr.length);
  });

  it('should contain all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('should not mutate original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it('should produce deterministic results with seeded random', () => {
    const arr = [1, 2, 3, 4, 5];
    // Create a simple deterministic "random" function
    let seed = 12345;
    const deterministicRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    
    const shuffled1 = shuffleArray(arr, deterministicRandom);
    
    // Reset seed
    seed = 12345;
    const shuffled2 = shuffleArray(arr, deterministicRandom);
    
    expect(shuffled1).toEqual(shuffled2);
  });
});

describe('createShuffledDecks', () => {
  it('should create decks with correct card counts', () => {
    const decks = createShuffledDecks();
    
    expect(decks.tier1.length).toBe(40);
    expect(decks.tier2.length).toBe(30);
    expect(decks.tier3.length).toBe(20);
  });

  it('should have all cards in correct tiers', () => {
    const decks = createShuffledDecks();
    
    decks.tier1.forEach(card => expect(card.tier).toBe(1));
    decks.tier2.forEach(card => expect(card.tier).toBe(2));
    decks.tier3.forEach(card => expect(card.tier).toBe(3));
  });
});

describe('createInitialMarket', () => {
  it('should reveal 4 cards per tier', () => {
    const decks = createShuffledDecks();
    const { market, remainingDecks } = createInitialMarket(decks);
    
    expect(market.tier1.length).toBe(4);
    expect(market.tier2.length).toBe(4);
    expect(market.tier3.length).toBe(4);
  });

  it('should remove revealed cards from decks', () => {
    const decks = createShuffledDecks();
    const initialTier1 = decks.tier1.length;
    const { remainingDecks } = createInitialMarket(decks);
    
    expect(remainingDecks.tier1.length).toBe(initialTier1 - 4);
    expect(remainingDecks.tier2.length).toBe(30 - 4);
    expect(remainingDecks.tier3.length).toBe(20 - 4);
  });
});

describe('selectNobles', () => {
  it('should select correct number of nobles for 2 players', () => {
    const nobles = selectNobles(2);
    expect(nobles.length).toBe(3); // playerCount + 1
  });

  it('should select correct number of nobles for 3 players', () => {
    const nobles = selectNobles(3);
    expect(nobles.length).toBe(4);
  });

  it('should select correct number of nobles for 4 players', () => {
    const nobles = selectNobles(4);
    expect(nobles.length).toBe(5);
  });

  it('should select all nobles with 3 prestige points', () => {
    const nobles = selectNobles(4);
    nobles.forEach(noble => expect(noble.prestigePoints).toBe(3));
  });
});

describe('createGame', () => {
  it('should create a game with correct player count', () => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    
    const game = createGame(config, players);
    
    expect(game.players.length).toBe(2);
  });

  it('should throw error if player count mismatch', () => {
    const config: GameConfig = { playerCount: 3 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    
    expect(() => createGame(config, players)).toThrow();
  });

  it('should initialize game in playing phase', () => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    
    const game = createGame(config, players);
    
    expect(game.phase).toBe('playing');
  });

  it('should start on round 1', () => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    
    const game = createGame(config, players);
    
    expect(game.round).toBe(1);
    expect(game.currentPlayerIndex).toBe(0);
  });

  it('should have correct bank for player count', () => {
    const config: GameConfig = { playerCount: 3 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
      { id: 'p3', name: 'Charlie' },
    ];
    
    const game = createGame(config, players);
    
    expect(game.bank.emerald).toBe(5);
    expect(game.bank.gold).toBe(5);
  });

  it('should have market with 12 visible cards', () => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    
    const game = createGame(config, players);
    
    const totalVisible = 
      game.market.tier1.length + 
      game.market.tier2.length + 
      game.market.tier3.length;
    
    expect(totalVisible).toBe(12);
  });
});

describe('cloneGameState', () => {
  it('should create deep copy of game state', () => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    
    const game = createGame(config, players);
    const clone = cloneGameState(game);
    
    // Modify clone
    clone.round = 5;
    clone.players[0].gems.emerald = 10;
    
    // Original should be unchanged
    expect(game.round).toBe(1);
    expect(game.players[0].gems.emerald).toBe(0);
  });
});

describe('getCurrentPlayer', () => {
  it('should return the current player based on index', () => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    
    // Use deterministic random to ensure player order
    let seed = 0;
    const deterministicRandom = () => {
      seed = (seed + 0.5) % 1;
      return seed;
    };
    
    const game = createGame(config, players, deterministicRandom);
    const current = getCurrentPlayer(game);
    
    expect(current).toBe(game.players[game.currentPlayerIndex]);
  });
});

describe('getPlayerById', () => {
  it('should find player by ID', () => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    
    const game = createGame(config, players);
    const alice = getPlayerById(game, 'p1');
    
    expect(alice).toBeDefined();
    expect(alice!.name).toBe('Alice');
  });

  it('should return undefined for non-existent player', () => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    
    const game = createGame(config, players);
    const unknown = getPlayerById(game, 'p99');
    
    expect(unknown).toBeUndefined();
  });
});
