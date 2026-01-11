import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateAction,
  validateTakeThreeGems,
  validateTakeTwoGems,
  validateReserveCard,
  validatePurchaseCard,
  validateSelectNoble,
  validateDiscardGems,
  isPlayersTurn,
  calculateEffectiveCost,
  canAffordCard,
  getEligibleNobles,
  getTotalGems,
  needsToDiscardGems,
} from '../validators';
import { createGame, createPlayer, cloneGameState } from '../initialization';
import { GameState, GameConfig, GAME_CONSTANTS, DevelopmentCard, Noble } from '../types';

describe('Validators', () => {
  let game: GameState;
  
  beforeEach(() => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    game = createGame(config, players);
  });

  describe('isPlayersTurn', () => {
    it('should return true for current player', () => {
      const currentPlayerId = game.players[game.currentPlayerIndex].id;
      expect(isPlayersTurn(game, currentPlayerId)).toBe(true);
    });

    it('should return false for non-current player', () => {
      const otherIndex = (game.currentPlayerIndex + 1) % game.players.length;
      const otherPlayerId = game.players[otherIndex].id;
      expect(isPlayersTurn(game, otherPlayerId)).toBe(false);
    });
  });

  describe('validateTakeThreeGems', () => {
    it('should succeed when taking 3 different available gems', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const result = validateTakeThreeGems(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when not players turn', () => {
      const otherIndex = (game.currentPlayerIndex + 1) % game.players.length;
      const otherPlayer = game.players[otherIndex];
      
      const result = validateTakeThreeGems(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: otherPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('NOT_PLAYERS_TURN');
    });

    it('should fail when gems are not all different', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const result = validateTakeThreeGems(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'emerald', 'sapphire'],
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('GEMS_NOT_DISTINCT');
    });

    it('should fail when gem not available in bank', () => {
      // Empty the emerald pile
      game.bank.emerald = 0;
      
      const currentPlayer = game.players[game.currentPlayerIndex];
      const result = validateTakeThreeGems(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_GEMS_IN_BANK');
    });
  });

  describe('validateTakeTwoGems', () => {
    it('should succeed when bank has 4+ of requested gem', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      // For 2 players, bank starts with 4 of each (exactly the minimum)
      const result = validateTakeTwoGems(game, {
        type: 'TAKE_TWO_GEMS',
        playerId: currentPlayer.id,
        gem: 'emerald',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when bank has fewer than 4', () => {
      game.bank.emerald = 3;
      
      const currentPlayer = game.players[game.currentPlayerIndex];
      const result = validateTakeTwoGems(game, {
        type: 'TAKE_TWO_GEMS',
        playerId: currentPlayer.id,
        gem: 'emerald',
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('REQUIRES_FOUR_GEMS_FOR_TWO');
    });

    it('should fail when not players turn', () => {
      const otherIndex = (game.currentPlayerIndex + 1) % game.players.length;
      const otherPlayer = game.players[otherIndex];
      
      const result = validateTakeTwoGems(game, {
        type: 'TAKE_TWO_GEMS',
        playerId: otherPlayer.id,
        gem: 'emerald',
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('NOT_PLAYERS_TURN');
    });
  });

  describe('validateReserveCard', () => {
    it('should succeed when reserving a market card', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const cardId = game.market.tier1[0].id;
      
      const result = validateReserveCard(game, {
        type: 'RESERVE_CARD',
        playerId: currentPlayer.id,
        cardId,
        tier: 1,
      });
      expect(result.valid).toBe(true);
    });

    it('should succeed when blind drawing from deck', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const result = validateReserveCard(game, {
        type: 'RESERVE_CARD',
        playerId: currentPlayer.id,
        cardId: null,
        tier: 2,
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when player has 3 reserved cards', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Give player 3 reserved cards
      currentPlayer.reservedCards = [
        { id: 'r1', tier: 1, cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 }, bonus: 'emerald', prestigePoints: 0 },
        { id: 'r2', tier: 1, cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 }, bonus: 'emerald', prestigePoints: 0 },
        { id: 'r3', tier: 1, cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 }, bonus: 'emerald', prestigePoints: 0 },
      ];
      
      const result = validateReserveCard(game, {
        type: 'RESERVE_CARD',
        playerId: currentPlayer.id,
        cardId: game.market.tier1[0].id,
        tier: 1,
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('MAX_RESERVED_CARDS');
    });

    it('should fail when card not in market', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const result = validateReserveCard(game, {
        type: 'RESERVE_CARD',
        playerId: currentPlayer.id,
        cardId: 'nonexistent',
        tier: 1,
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('CARD_NOT_AVAILABLE');
    });

    it('should fail when deck is empty for blind draw', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      game.decks.tier1 = [];
      
      const result = validateReserveCard(game, {
        type: 'RESERVE_CARD',
        playerId: currentPlayer.id,
        cardId: null,
        tier: 1,
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('CARD_NOT_AVAILABLE');
    });
  });

  describe('validatePurchaseCard', () => {
    it('should succeed when player can afford market card', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Find a cheap card or give player enough gems
      const card = game.market.tier1[0];
      currentPlayer.gems = {
        emerald: 10, diamond: 10, sapphire: 10, onyx: 10, ruby: 10, gold: 5,
      };
      
      const result = validatePurchaseCard(game, {
        type: 'PURCHASE_CARD',
        playerId: currentPlayer.id,
        cardId: card.id,
      });
      expect(result.valid).toBe(true);
    });

    it('should succeed when player can afford reserved card', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const reservedCard: DevelopmentCard = {
        id: 'reserved1',
        tier: 1,
        cost: { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'diamond',
        prestigePoints: 0,
      };
      currentPlayer.reservedCards = [reservedCard];
      currentPlayer.gems = { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      const result = validatePurchaseCard(game, {
        type: 'PURCHASE_CARD',
        playerId: currentPlayer.id,
        cardId: reservedCard.id,
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when player cannot afford card', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const card = game.market.tier3[0]; // Tier 3 cards are expensive
      
      const result = validatePurchaseCard(game, {
        type: 'PURCHASE_CARD',
        playerId: currentPlayer.id,
        cardId: card.id,
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_PAYMENT');
    });

    it('should succeed when using bonuses to reduce cost', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Add card that costs 3 emeralds
      const card: DevelopmentCard = game.market.tier1[0];
      // Override cost for testing
      const testGame = cloneGameState(game);
      const testCard = { ...card, cost: { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 } };
      testGame.market.tier1[0] = testCard;
      
      // Give player 2 emerald bonuses (reduces cost to 1 emerald)
      const testPlayer = testGame.players[testGame.currentPlayerIndex];
      testPlayer.bonuses.emerald = 2;
      testPlayer.gems = { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      const result = validatePurchaseCard(testGame, {
        type: 'PURCHASE_CARD',
        playerId: testPlayer.id,
        cardId: testCard.id,
      });
      expect(result.valid).toBe(true);
    });

    it('should succeed when using gold to cover shortfall', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const testGame = cloneGameState(game);
      const testCard = { 
        ...testGame.market.tier1[0], 
        cost: { emerald: 2, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 } 
      };
      testGame.market.tier1[0] = testCard;
      
      const testPlayer = testGame.players[testGame.currentPlayerIndex];
      // Only 1 emerald but 1 gold
      testPlayer.gems = { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 1 };
      
      const result = validatePurchaseCard(testGame, {
        type: 'PURCHASE_CARD',
        playerId: testPlayer.id,
        cardId: testCard.id,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateSelectNoble', () => {
    it('should succeed when player meets noble requirements', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const noble: Noble = {
        id: 'test-noble',
        requirements: { emerald: 3, diamond: 3, sapphire: 0, onyx: 0, ruby: 0 },
        prestigePoints: 3,
      };
      game.nobles = [noble];
      
      // Give player required bonuses
      currentPlayer.bonuses = { emerald: 3, diamond: 3, sapphire: 0, onyx: 0, ruby: 0 };
      
      const result = validateSelectNoble(game, {
        type: 'SELECT_NOBLE',
        playerId: currentPlayer.id,
        nobleId: noble.id,
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when player does not meet requirements', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const noble: Noble = {
        id: 'test-noble',
        requirements: { emerald: 3, diamond: 3, sapphire: 0, onyx: 0, ruby: 0 },
        prestigePoints: 3,
      };
      game.nobles = [noble];
      
      // Player doesn't have enough bonuses
      currentPlayer.bonuses = { emerald: 2, diamond: 3, sapphire: 0, onyx: 0, ruby: 0 };
      
      const result = validateSelectNoble(game, {
        type: 'SELECT_NOBLE',
        playerId: currentPlayer.id,
        nobleId: noble.id,
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('NOBLE_NOT_ELIGIBLE');
    });

    it('should fail when noble not available', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const result = validateSelectNoble(game, {
        type: 'SELECT_NOBLE',
        playerId: currentPlayer.id,
        nobleId: 'nonexistent',
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('NOBLE_NOT_ELIGIBLE');
    });
  });

  describe('validateDiscardGems', () => {
    it('should succeed when discarding to exactly 10 gems', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Give player 12 gems
      currentPlayer.gems = { emerald: 3, diamond: 3, sapphire: 3, onyx: 2, ruby: 1, gold: 0 };
      game.pendingGemDiscard = currentPlayer.id;
      
      const result = validateDiscardGems(game, {
        type: 'DISCARD_GEMS',
        playerId: currentPlayer.id,
        gems: { emerald: 1, diamond: 1, sapphire: 0, onyx: 0, ruby: 0, gold: 0 },
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when discarding too few gems', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Give player 12 gems
      currentPlayer.gems = { emerald: 3, diamond: 3, sapphire: 3, onyx: 2, ruby: 1, gold: 0 };
      game.pendingGemDiscard = currentPlayer.id;
      
      const result = validateDiscardGems(game, {
        type: 'DISCARD_GEMS',
        playerId: currentPlayer.id,
        gems: { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 },
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_DISCARD_AMOUNT');
    });

    it('should fail when player doesnt need to discard', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Player has only 8 gems
      currentPlayer.gems = { emerald: 2, diamond: 2, sapphire: 2, onyx: 1, ruby: 1, gold: 0 };
      
      const result = validateDiscardGems(game, {
        type: 'DISCARD_GEMS',
        playerId: currentPlayer.id,
        gems: { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 },
      });
      expect(result.valid).toBe(false);
    });

    it('should fail when discarding more gems than owned', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Give player 11 gems
      currentPlayer.gems = { emerald: 3, diamond: 3, sapphire: 3, onyx: 1, ruby: 1, gold: 0 };
      game.pendingGemDiscard = currentPlayer.id;
      
      const result = validateDiscardGems(game, {
        type: 'DISCARD_GEMS',
        playerId: currentPlayer.id,
        gems: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 2, gold: 0 }, // Only has 1 ruby
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAction', () => {
    it('should fail when game not in progress', () => {
      game.phase = 'ended';
      
      const currentPlayer = game.players[game.currentPlayerIndex];
      const result = validateAction(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('GAME_NOT_IN_PROGRESS');
    });

    it('should dispatch to correct validator', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Valid take 3 gems
      const result = validateAction(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    describe('calculateEffectiveCost', () => {
      it('should reduce cost by player bonuses', () => {
        const currentPlayer = game.players[game.currentPlayerIndex];
        currentPlayer.bonuses = { emerald: 2, diamond: 1, sapphire: 0, onyx: 0, ruby: 0 };
        
        const card = game.market.tier1[0];
        // Modify card cost for testing
        const testGame = cloneGameState(game);
        testGame.market.tier1[0] = {
          ...card,
          cost: { emerald: 3, diamond: 2, sapphire: 1, onyx: 0, ruby: 0 },
        };
        testGame.players[testGame.currentPlayerIndex].bonuses = { 
          emerald: 2, diamond: 1, sapphire: 0, onyx: 0, ruby: 0 
        };
        
        const effectiveCost = calculateEffectiveCost(
          testGame,
          testGame.players[testGame.currentPlayerIndex].id,
          testGame.market.tier1[0].id
        );
        
        expect(effectiveCost).toEqual({
          emerald: 1,  // 3 - 2
          diamond: 1,  // 2 - 1
          sapphire: 1, // 1 - 0
          onyx: 0,
          ruby: 0,
        });
      });

      it('should not go below 0', () => {
        const testGame = cloneGameState(game);
        testGame.market.tier1[0] = {
          ...testGame.market.tier1[0],
          cost: { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        };
        testGame.players[testGame.currentPlayerIndex].bonuses = { 
          emerald: 5, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 
        };
        
        const effectiveCost = calculateEffectiveCost(
          testGame,
          testGame.players[testGame.currentPlayerIndex].id,
          testGame.market.tier1[0].id
        );
        
        expect(effectiveCost?.emerald).toBe(0);
      });
    });

    describe('getTotalGems', () => {
      it('should count all gems including gold', () => {
        const currentPlayer = game.players[game.currentPlayerIndex];
        currentPlayer.gems = { emerald: 2, diamond: 1, sapphire: 3, onyx: 0, ruby: 2, gold: 1 };
        
        const total = getTotalGems(game, currentPlayer.id);
        expect(total).toBe(9);
      });
    });

    describe('needsToDiscardGems', () => {
      it('should return true when player has more than 10 gems', () => {
        const currentPlayer = game.players[game.currentPlayerIndex];
        currentPlayer.gems = { emerald: 3, diamond: 3, sapphire: 3, onyx: 1, ruby: 1, gold: 1 };
        
        expect(needsToDiscardGems(game, currentPlayer.id)).toBe(true);
      });

      it('should return false when player has 10 or fewer gems', () => {
        const currentPlayer = game.players[game.currentPlayerIndex];
        currentPlayer.gems = { emerald: 2, diamond: 2, sapphire: 2, onyx: 2, ruby: 1, gold: 1 };
        
        expect(needsToDiscardGems(game, currentPlayer.id)).toBe(false);
      });
    });

    describe('getEligibleNobles', () => {
      it('should return nobles player qualifies for', () => {
        const currentPlayer = game.players[game.currentPlayerIndex];
        
        const noble1: Noble = {
          id: 'noble1',
          requirements: { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
          prestigePoints: 3,
        };
        const noble2: Noble = {
          id: 'noble2',
          requirements: { emerald: 0, diamond: 4, sapphire: 0, onyx: 0, ruby: 0 },
          prestigePoints: 3,
        };
        game.nobles = [noble1, noble2];
        
        currentPlayer.bonuses = { emerald: 3, diamond: 2, sapphire: 0, onyx: 0, ruby: 0 };
        
        const eligible = getEligibleNobles(game, currentPlayer.id);
        expect(eligible).toEqual(['noble1']);
      });

      it('should return empty array when player qualifies for none', () => {
        const currentPlayer = game.players[game.currentPlayerIndex];
        currentPlayer.bonuses = { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 };
        
        const eligible = getEligibleNobles(game, currentPlayer.id);
        expect(eligible).toEqual([]);
      });
    });
  });
});
