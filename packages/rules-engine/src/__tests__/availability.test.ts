import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAvailableActions,
  getTakeGemOptions,
  getReservableCards,
  getPurchasableCards,
  canPurchaseCard,
  getCardShortfall,
  getMarketCards,
  hasDeckCards,
} from '../availability';
import { createGame, getPlayerById } from '../initialization';
import { GameState, GameConfig, DevelopmentCard, Noble, GAME_CONSTANTS } from '../types';

describe('Availability', () => {
  let game: GameState;
  
  beforeEach(() => {
    const config: GameConfig = { playerCount: 2 };
    const players = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    game = createGame(config, players);
  });

  describe('getAvailableActions', () => {
    it('should return valid actions for current player', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const actions = getAvailableActions(game, currentPlayer.id);
      
      expect(actions.isPlayerTurn).toBe(true);
      expect(actions.mustDiscardGems).toBe(false);
      expect(actions.mustSelectNoble).toBe(false);
      expect(actions.takeGems.canTakeThree).toBe(true);
      expect(actions.reservableCards.canReserve).toBe(true);
    });

    it('should return no main actions for non-current player', () => {
      const otherIndex = (game.currentPlayerIndex + 1) % game.players.length;
      const otherPlayer = game.players[otherIndex];
      const actions = getAvailableActions(game, otherPlayer.id);
      
      expect(actions.isPlayerTurn).toBe(false);
      expect(actions.takeGems.canTakeThree).toBe(false);
      expect(actions.reservableCards.canReserve).toBe(false);
      expect(actions.purchasableCards.marketCards).toEqual([]);
    });

    it('should indicate must discard gems when pending', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.gems = { emerald: 4, diamond: 4, sapphire: 4, onyx: 0, ruby: 0, gold: 0 };
      game.pendingGemDiscard = currentPlayer.id;
      
      const actions = getAvailableActions(game, currentPlayer.id);
      
      expect(actions.mustDiscardGems).toBe(true);
      expect(actions.gemsToDiscard).toBe(2);
      
      // Should not allow other actions
      expect(actions.takeGems.canTakeThree).toBe(false);
    });

    it('should indicate must select noble when pending', () => {
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
      currentPlayer.bonuses = { emerald: 3, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 };
      game.pendingNobleSelection = currentPlayer.id;
      
      const actions = getAvailableActions(game, currentPlayer.id);
      
      expect(actions.mustSelectNoble).toBe(true);
      expect(actions.selectableNobles).toContain('noble1');
      expect(actions.selectableNobles).toContain('noble2');
    });

    it('should return empty actions for non-existent player', () => {
      const actions = getAvailableActions(game, 'nonexistent');
      
      expect(actions.isPlayerTurn).toBe(false);
      expect(actions.takeGems.canTakeThree).toBe(false);
    });
  });

  describe('getTakeGemOptions', () => {
    it('should allow take three when 3+ colors available', () => {
      const options = getTakeGemOptions(game);
      
      expect(options.canTakeThree).toBe(true);
      expect(options.availableForThree.length).toBe(5);
    });

    it('should allow taking gems when fewer than 3 colors available', () => {
      game.bank = { emerald: 1, diamond: 1, sapphire: 0, onyx: 0, ruby: 0, gold: 5 };
      
      const options = getTakeGemOptions(game);
      
      // Can still take gems, just limited to what's available
      expect(options.canTakeThree).toBe(true);
      expect(options.availableForThree.length).toBe(2);
    });

    it('should list colors available for take two', () => {
      // 2-player game has 4 gems per color (minimum for take two)
      const options = getTakeGemOptions(game);
      
      expect(options.availableForTwo.length).toBe(5);
    });

    it('should not include colors with fewer than 4 for take two', () => {
      game.bank.emerald = 3;
      game.bank.diamond = 2;
      
      const options = getTakeGemOptions(game);
      
      expect(options.availableForTwo).not.toContain('emerald');
      expect(options.availableForTwo).not.toContain('diamond');
      expect(options.availableForTwo.length).toBe(3);
    });
  });

  describe('getReservableCards', () => {
    it('should allow reserve when player has fewer than 3 reserved', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const reservable = getReservableCards(game, currentPlayer.id);
      
      expect(reservable.canReserve).toBe(true);
      expect(reservable.marketCards.length).toBe(12); // 4 per tier
      expect(reservable.blindDrawTiers).toEqual([1, 2, 3]);
    });

    it('should not allow reserve when player has 3 reserved', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.reservedCards = [
        { id: 'r1', tier: 1, cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 }, bonus: 'emerald', prestigePoints: 0 },
        { id: 'r2', tier: 1, cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 }, bonus: 'emerald', prestigePoints: 0 },
        { id: 'r3', tier: 1, cost: { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 }, bonus: 'emerald', prestigePoints: 0 },
      ];
      
      const reservable = getReservableCards(game, currentPlayer.id);
      
      expect(reservable.canReserve).toBe(false);
      expect(reservable.marketCards).toEqual([]);
      expect(reservable.blindDrawTiers).toEqual([]);
    });

    it('should not include empty deck tiers for blind draw', () => {
      game.decks.tier1 = [];
      
      const currentPlayer = game.players[game.currentPlayerIndex];
      const reservable = getReservableCards(game, currentPlayer.id);
      
      expect(reservable.blindDrawTiers).not.toContain(1);
      expect(reservable.blindDrawTiers).toContain(2);
      expect(reservable.blindDrawTiers).toContain(3);
    });
  });

  describe('getPurchasableCards', () => {
    it('should return affordable market cards', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      // Give player lots of gems
      currentPlayer.gems = { emerald: 10, diamond: 10, sapphire: 10, onyx: 10, ruby: 10, gold: 5 };
      
      const purchasable = getPurchasableCards(game, currentPlayer.id);
      
      // Should be able to afford all market cards
      expect(purchasable.marketCards.length).toBe(12);
    });

    it('should return affordable reserved cards', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      
      const cheapCard: DevelopmentCard = {
        id: 'cheap',
        tier: 1,
        cost: { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'diamond',
        prestigePoints: 0,
      };
      const expensiveCard: DevelopmentCard = {
        id: 'expensive',
        tier: 3,
        cost: { emerald: 10, diamond: 10, sapphire: 10, onyx: 10, ruby: 10 },
        bonus: 'diamond',
        prestigePoints: 5,
      };
      currentPlayer.reservedCards = [cheapCard, expensiveCard];
      currentPlayer.gems = { emerald: 1, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      const purchasable = getPurchasableCards(game, currentPlayer.id);
      
      expect(purchasable.reservedCards).toContain('cheap');
      expect(purchasable.reservedCards).not.toContain('expensive');
    });

    it('should return empty for player with no gems', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.gems = { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      const purchasable = getPurchasableCards(game, currentPlayer.id);
      
      // Tier 1 cards have minimum cost of 3, so can't afford anything
      expect(purchasable.marketCards.length).toBeLessThan(12);
    });
  });

  describe('canPurchaseCard', () => {
    it('should return true when player can afford card', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.gems = { emerald: 10, diamond: 10, sapphire: 10, onyx: 10, ruby: 10, gold: 5 };
      
      const cardId = game.market.tier1[0].id;
      
      expect(canPurchaseCard(game, currentPlayer.id, cardId)).toBe(true);
    });

    it('should return false when player cannot afford card', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.gems = { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      const cardId = game.market.tier3[0].id; // Expensive card
      
      expect(canPurchaseCard(game, currentPlayer.id, cardId)).toBe(false);
    });
  });

  describe('getCardShortfall', () => {
    it('should return zeros when player can afford card', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.gems = { emerald: 10, diamond: 10, sapphire: 10, onyx: 10, ruby: 10, gold: 5 };
      
      const cardId = game.market.tier1[0].id;
      const shortfall = getCardShortfall(game, currentPlayer.id, cardId);
      
      expect(shortfall.emerald).toBe(0);
      expect(shortfall.diamond).toBe(0);
      expect(shortfall.sapphire).toBe(0);
      expect(shortfall.onyx).toBe(0);
      expect(shortfall.ruby).toBe(0);
    });

    it('should return shortfall amounts for each color', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.gems = { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 0 };
      
      // Set up card with known cost
      const card: DevelopmentCard = {
        id: 'test-card',
        tier: 1,
        cost: { emerald: 3, diamond: 2, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'onyx',
        prestigePoints: 0,
      };
      game.market.tier1[0] = card;
      
      const shortfall = getCardShortfall(game, currentPlayer.id, card.id);
      
      expect(shortfall.emerald).toBe(3);
      expect(shortfall.diamond).toBe(2);
    });

    it('should account for gold in shortfall', () => {
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.gems = { emerald: 0, diamond: 0, sapphire: 0, onyx: 0, ruby: 0, gold: 2 };
      
      const card: DevelopmentCard = {
        id: 'test-card',
        tier: 1,
        cost: { emerald: 3, diamond: 2, sapphire: 0, onyx: 0, ruby: 0 },
        bonus: 'onyx',
        prestigePoints: 0,
      };
      game.market.tier1[0] = card;
      
      const shortfall = getCardShortfall(game, currentPlayer.id, card.id);
      
      // Gold should reduce shortfall
      const totalShortfall = shortfall.emerald + shortfall.diamond + shortfall.sapphire + shortfall.onyx + shortfall.ruby;
      expect(totalShortfall).toBe(3); // 5 needed - 2 gold = 3 shortfall
    });
  });

  describe('Utility Functions', () => {
    describe('getMarketCards', () => {
      it('should return all market cards', () => {
        const cards = getMarketCards(game);
        expect(cards.length).toBe(12);
      });
    });

    describe('hasDeckCards', () => {
      it('should return true when deck has cards', () => {
        expect(hasDeckCards(game, 1)).toBe(true);
        expect(hasDeckCards(game, 2)).toBe(true);
        expect(hasDeckCards(game, 3)).toBe(true);
      });

      it('should return false when deck is empty', () => {
        game.decks.tier1 = [];
        expect(hasDeckCards(game, 1)).toBe(false);
      });
    });
  });
});
