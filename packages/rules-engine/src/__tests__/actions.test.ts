import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyAction,
  applyTakeThreeGems,
  applyTakeTwoGems,
  applyReserveCard,
  applyPurchaseCard,
  applySelectNoble,
  applyDiscardGems,
  advanceTurn,
  determineWinners,
  calculatePayment,
} from '../actions';
import { createGame, cloneGameState, getPlayerById } from '../initialization';
import { GameState, GameConfig, DevelopmentCard, Noble, GAME_CONSTANTS } from '../types';

describe('Actions', () => {
  let game: GameState;
  
  beforeEach(() => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    game = createGame(config, players);
  });

  describe('applyTakeThreeGems', () => {
    it('should transfer gems from bank to player', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const initialBankEmerald = game.bank.emerald;
      const initialBankDiamond = game.bank.diamond;
      const initialBankSapphire = game.bank.sapphire;
      
      const newState = applyTakeThreeGems(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      
      const player = getPlayerById(newState, currentPlayer.id)!;
      
      // Player should have gained gems
      expect(player.gems.emerald).toBe(1);
      expect(player.gems.diamond).toBe(1);
      expect(player.gems.sapphire).toBe(1);
      
      // Bank should have lost gems
      expect(newState.bank.emerald).toBe(initialBankEmerald - 1);
      expect(newState.bank.diamond).toBe(initialBankDiamond - 1);
      expect(newState.bank.sapphire).toBe(initialBankSapphire - 1);
    });

    it('should advance to next player', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const newState = applyTakeThreeGems(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      
      expect(newState.currentPlayerIndex).toBe((game.currentPlayerIndex + 1) % game.players.length);
    });

    it('should not mutate original state', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const originalBank = { ...game.bank };
      
      applyTakeThreeGems(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      
      expect(game.bank).toEqual(originalBank);
    });
  });

  describe('applyTakeTwoGems', () => {
    it('should transfer 2 gems from bank to player', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const initialBank = game.bank.emerald;
      
      const newState = applyTakeTwoGems(game, {
        type: 'TAKE_TWO_GEMS',
        playerId: currentPlayer.id,
        gem: 'emerald',
      });
      
      const player = getPlayerById(newState, currentPlayer.id)!;
      
      expect(player.gems.emerald).toBe(2);
      expect(newState.bank.emerald).toBe(initialBank - 2);
    });
  });

  describe('applyReserveCard', () => {
    it('should move card from market to reserved', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const card = game.market.tier1[0];
      
      const newState = applyReserveCard(game, {
        type: 'RESERVE_CARD',
        playerId: currentPlayer.id,
        cardId: card.id,
        tier: 1,
      });
      
      const player = getPlayerById(newState, currentPlayer.id)!;
      
      // Card should be in reserved
      expect(player.reservedCards.some(c => c.id === card.id)).toBe(true);
      
      // Card should not be in market
      expect(newState.market.tier1.some(c => c.id === card.id)).toBe(false);
    });

    it('should give player gold gem if available', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const initialGold = currentPlayer.gems.gold;
      const card = game.market.tier1[0];
      
      const newState = applyReserveCard(game, {
        type: 'RESERVE_CARD',
        playerId: currentPlayer.id,
        cardId: card.id,
        tier: 1,
      });
      
      const player = getPlayerById(newState, currentPlayer.id)!;
      expect(player.gems.gold).toBe(initialGold + 1);
    });

    it('should refill market from deck', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const card = game.market.tier1[0];
      
      const newState = applyReserveCard(game, {
        type: 'RESERVE_CARD',
        playerId: currentPlayer.id,
        cardId: card.id,
        tier: 1,
      });
      
      // Market should still have 4 cards (refilled from deck)
      expect(newState.market.tier1.length).toBe(4);
    });

    it('should do blind draw when cardId is null', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const initialDeckSize = game.decks.tier2.length;
      
      const newState = applyReserveCard(game, {
        type: 'RESERVE_CARD',
        playerId: currentPlayer.id,
        cardId: null,
        tier: 2,
      });
      
      const player = getPlayerById(newState, currentPlayer.id)!;
      
      // Should have 1 reserved card
      expect(player.reservedCards.length).toBe(1);
      
      // Deck should have one fewer card
      expect(newState.decks.tier2.length).toBe(initialDeckSize - 1);
      
      // Market should still have same cards
      expect(newState.market.tier2.length).toBe(game.market.tier2.length);
    });
  });

  describe('applyPurchaseCard', () => {
    it('should move card to purchased and update bonuses', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Give player enough gems
      currentPlayer.gems = { emerald: 10, diamond: 10, sapphire: 10, onyx: 10, ruby: 10, gold: 5 };
      
      const card = game.market.tier1[0];
      
      const newState = applyPurchaseCard(game, {
        type: 'PURCHASE_CARD',
        playerId: currentPlayer.id,
        cardId: card.id,
      });
      
      const player = getPlayerById(newState, currentPlayer.id)!;
      
      // Card should be in purchased
      expect(player.purchasedCards.some(c => c.id === card.id)).toBe(true);
      
      // Bonuses should be updated
      expect(player.bonuses[card.bonus]).toBe(1);
      
      // Prestige should be updated
      expect(player.prestigePoints).toBe(card.prestigePoints);
    });

    it('should return payment gems to bank', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Set up a card with specific cost
      const testGame = cloneGameState(game);
      const testCard: DevelopmentCard = {
        id: 'test-card',
        tier: 1,
        cost: { emerald: 2, diamond: 1, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'onyx',
        prestigePoints: 1,
      };
      testGame.market.tier1[0] = testCard;
      
      const testPlayer = testGame.players[testGame.currentPlayerIndex];
      testPlayer.gems = { emerald: 3, diamond: 2, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      const initialBankEmerald = testGame.bank.emerald;
      const initialBankDiamond = testGame.bank.diamond;
      
      const newState = applyPurchaseCard(testGame, {
        type: 'PURCHASE_CARD',
        playerId: testPlayer.id,
        cardId: testCard.id,
      });
      
      // Bank should have received payment
      expect(newState.bank.emerald).toBe(initialBankEmerald + 2);
      expect(newState.bank.diamond).toBe(initialBankDiamond + 1);
      
      // Player should have lost gems
      const player = getPlayerById(newState, testPlayer.id)!;
      expect(player.gems.emerald).toBe(1);
      expect(player.gems.diamond).toBe(1);
    });

    it('should use gold for shortfall', () => {
      const testGame = cloneGameState(game);
      const testCard: DevelopmentCard = {
        id: 'test-card',
        tier: 1,
        cost: { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'onyx',
        prestigePoints: 1,
      };
      testGame.market.tier1[0] = testCard;
      
      const testPlayer = testGame.players[testGame.currentPlayerIndex];
      // Only 1 emerald but 2 gold
      testPlayer.gems = { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 2 };
      
      const newState = applyPurchaseCard(testGame, {
        type: 'PURCHASE_CARD',
        playerId: testPlayer.id,
        cardId: testCard.id,
      });
      
      const player = getPlayerById(newState, testPlayer.id)!;
      expect(player.gems.emerald).toBe(0);
      expect(player.gems.gold).toBe(0);
    });

    it('should apply bonuses to reduce cost', () => {
      const testGame = cloneGameState(game);
      const testCard: DevelopmentCard = {
        id: 'test-card',
        tier: 1,
        cost: { emerald: 4, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'onyx',
        prestigePoints: 1,
      };
      testGame.market.tier1[0] = testCard;
      
      const testPlayer = testGame.players[testGame.currentPlayerIndex];
      // 2 emerald bonuses reduce cost to 2
      testPlayer.bonuses = { emerald: 2, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 };
      testPlayer.gems = { emerald: 2, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      const newState = applyPurchaseCard(testGame, {
        type: 'PURCHASE_CARD',
        playerId: testPlayer.id,
        cardId: testCard.id,
      });
      
      const player = getPlayerById(newState, testPlayer.id)!;
      expect(player.gems.emerald).toBe(0);
      expect(player.purchasedCards.some(c => c.id === testCard.id)).toBe(true);
    });
  });

  describe('applySelectNoble', () => {
    it('should move noble to player and award prestige', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const noble: Noble = {
        id: 'test-noble',
        requirements: { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        prestigePoints: 3,
      };
      game.nobles = [noble];
      game.pendingNobleSelection = currentPlayer.id;
      currentPlayer.bonuses = { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 };
      
      const newState = applySelectNoble(game, {
        type: 'SELECT_NOBLE',
        playerId: currentPlayer.id,
        nobleId: noble.id,
      });
      
      const player = getPlayerById(newState, currentPlayer.id)!;
      
      // Noble should be with player
      expect(player.nobles.some(n => n.id === noble.id)).toBe(true);
      
      // Noble should not be available
      expect(newState.nobles.some(n => n.id === noble.id)).toBe(false);
      
      // Prestige should be updated
      expect(player.prestigePoints).toBe(3);
    });
  });

  describe('applyDiscardGems', () => {
    it('should return gems from player to bank', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.gems = { emerald: 5, diamond: 5, sapphire: 2, onyx: 0, ruby: 0, gold: 0 };
      game.pendingGemDiscard = currentPlayer.id;
      
      const initialBankEmerald = game.bank.emerald;
      
      const newState = applyDiscardGems(game, {
        type: 'DISCARD_GEMS',
        playerId: currentPlayer.id,
        gems: { emerald: 2, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 },
      });
      
      const player = getPlayerById(newState, currentPlayer.id)!;
      expect(player.gems.emerald).toBe(3);
      expect(newState.bank.emerald).toBe(initialBankEmerald + 2);
      expect(newState.pendingGemDiscard).toBeUndefined();
    });
  });

  describe('advanceTurn', () => {
    it('should advance to next player', () => {
      const newState = advanceTurn(game);
      expect(newState.currentPlayerIndex).toBe(1);
    });

    it('should wrap around and increment round', () => {
      game.currentPlayerIndex = game.players.length - 1;
      const newState = advanceTurn(game);
      
      expect(newState.currentPlayerIndex).toBe(0);
      expect(newState.round).toBe(2);
    });
  });

  describe('determineWinners', () => {
    it('should return player with highest prestige', () => {
      game.players[0].prestigePoints = 15;
      game.players[1].prestigePoints = 10;
      
      const winners = determineWinners(game);
      expect(winners).toEqual([game.players[0].id]);
    });

    it('should use card count as tiebreaker', () => {
      game.players[0].prestigePoints = 15;
      game.players[1].prestigePoints = 15;
      game.players[0].purchasedCards = [
        { id: 'c1', tier: 1, cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 }, bonus: 'emerald', prestigePoints: 0 },
        { id: 'c2', tier: 1, cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 }, bonus: 'emerald', prestigePoints: 0 },
      ];
      game.players[1].purchasedCards = [
        { id: 'c3', tier: 1, cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 }, bonus: 'emerald', prestigePoints: 0 },
      ];
      
      const winners = determineWinners(game);
      // Player with fewer cards wins
      expect(winners).toEqual([game.players[1].id]);
    });

    it('should return multiple winners for ties', () => {
      game.players[0].prestigePoints = 15;
      game.players[1].prestigePoints = 15;
      game.players[0].purchasedCards = [];
      game.players[1].purchasedCards = [];
      
      const winners = determineWinners(game);
      expect(winners.length).toBe(2);
    });
  });

  describe('calculatePayment', () => {
    it('should calculate correct payment with bonuses', () => {
      const testGame = cloneGameState(game);
      const testCard: DevelopmentCard = {
        id: 'test-card',
        tier: 1,
        cost: { emerald: 3, diamond: 2, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'onyx',
        prestigePoints: 1,
      };
      testGame.market.tier1[0] = testCard;
      
      const testPlayer = testGame.players[testGame.currentPlayerIndex];
      testPlayer.bonuses = { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 };
      testPlayer.gems = { emerald: 3, diamond: 3, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      const payment = calculatePayment(testGame, testPlayer.id, testCard.id);
      
      expect(payment).toEqual({
        gems: { emerald: 2, diamond: 2, sapphire: 0, onyx: 0, ruby: 0 },
        gold: 0,
      });
    });

    it('should use gold for shortfall', () => {
      const testGame = cloneGameState(game);
      const testCard: DevelopmentCard = {
        id: 'test-card',
        tier: 1,
        cost: { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'onyx',
        prestigePoints: 1,
      };
      testGame.market.tier1[0] = testCard;
      
      const testPlayer = testGame.players[testGame.currentPlayerIndex];
      testPlayer.gems = { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 2 };
      
      const payment = calculatePayment(testGame, testPlayer.id, testCard.id);
      
      expect(payment).toEqual({
        gems: { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        gold: 2,
      });
    });

    it('should return null if cannot afford', () => {
      const testGame = cloneGameState(game);
      const testCard: DevelopmentCard = {
        id: 'test-card',
        tier: 1,
        cost: { emerald: 5, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'onyx',
        prestigePoints: 1,
      };
      testGame.market.tier1[0] = testCard;
      
      const testPlayer = testGame.players[testGame.currentPlayerIndex];
      testPlayer.gems = { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 1 };
      
      const payment = calculatePayment(testGame, testPlayer.id, testCard.id);
      
      expect(payment).toBeNull();
    });
  });

  describe('Game End Scenarios', () => {
    it('should trigger final round when player reaches 15 points', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Give player enough gems and set up a card worth 15+ points
      const testCard: DevelopmentCard = {
        id: 'winning-card',
        tier: 3,
        cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'emerald',
        prestigePoints: 15,
      };
      game.market.tier3[0] = testCard;
      currentPlayer.gems = { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      const newState = applyPurchaseCard(game, {
        type: 'PURCHASE_CARD',
        playerId: currentPlayer.id,
        cardId: testCard.id,
      });
      
      expect(newState.phase).toBe('final_round');
      expect(newState.endGameTriggeredBy).toBe(currentPlayer.id);
    });

    it('should end game after final round completes', () => {
      // Set up final round
      game.phase = 'final_round';
      game.endGameTriggeredBy = game.players[0].id;
      game.players[0].prestigePoints = 15;
      game.currentPlayerIndex = game.players.length - 1; // Last player's turn
      
      // Complete the turn (this should end the game)
      const currentPlayer = game.players[game.currentPlayerIndex];
      // Must be under gem limit (10) to avoid pending discard
      currentPlayer.gems = { emerald: 1, diamond: 1, sapphire: 1, onyx: 1, ruby: 1, gold: 0 };
      
      const newState = applyTakeThreeGems(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      
      expect(newState.phase).toBe('ended');
      expect(newState.winners.length).toBeGreaterThan(0);
    });
  });

  describe('Noble Acquisition', () => {
    it('should auto-acquire noble when eligible after action', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Set up noble and player bonuses
      const noble: Noble = {
        id: 'test-noble',
        requirements: { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        prestigePoints: 3,
      };
      game.nobles = [noble];
      
      // Give player 2 emerald bonuses, card will give 3rd
      currentPlayer.bonuses = { emerald: 2, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 };
      
      // Set up card that gives emerald bonus
      const card: DevelopmentCard = {
        id: 'bonus-card',
        tier: 1,
        cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'emerald',
        prestigePoints: 0,
      };
      game.market.tier1[0] = card;
      
      const newState = applyPurchaseCard(game, {
        type: 'PURCHASE_CARD',
        playerId: currentPlayer.id,
        cardId: card.id,
      });
      
      const player = getPlayerById(newState, currentPlayer.id)!;
      
      // Should have acquired noble
      expect(player.nobles.length).toBe(1);
      expect(player.nobles[0].id).toBe(noble.id);
      expect(player.prestigePoints).toBe(3); // Noble's prestige
    });

    it('should wait for selection when multiple nobles are eligible', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const noble1: Noble = {
        id: 'noble1',
        requirements: { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        prestigePoints: 3,
      };
      const noble2: Noble = {
        id: 'noble2',
        requirements: { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        prestigePoints: 3,
      };
      game.nobles = [noble1, noble2];
      
      currentPlayer.bonuses = { emerald: 2, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 };
      
      const card: DevelopmentCard = {
        id: 'bonus-card',
        tier: 1,
        cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'emerald',
        prestigePoints: 0,
      };
      game.market.tier1[0] = card;
      
      const newState = applyPurchaseCard(game, {
        type: 'PURCHASE_CARD',
        playerId: currentPlayer.id,
        cardId: card.id,
      });
      
      // Should be waiting for noble selection
      expect(newState.pendingNobleSelection).toBe(currentPlayer.id);
      
      // Nobles should still be available
      expect(newState.nobles.length).toBe(2);
    });
  });

  describe('Gem Limit Enforcement', () => {
    it('should trigger discard when player exceeds 10 gems', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Give player 9 gems (will have 12 after taking 3)
      currentPlayer.gems = { emerald: 2, diamond: 2, sapphire: 2, onyx: 2, ruby: 1, gold: 0 };
      
      const newState = applyTakeThreeGems(game, {
        type: 'TAKE_THREE_GEMS',
        playerId: currentPlayer.id,
        gems: ['emerald', 'diamond', 'sapphire'],
      });
      
      // Should be waiting for discard
      expect(newState.pendingGemDiscard).toBe(currentPlayer.id);
      
      // Turn should not advance yet
      expect(newState.currentPlayerIndex).toBe(game.currentPlayerIndex);
    });
  });
});
