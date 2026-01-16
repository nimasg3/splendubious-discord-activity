/**
 * Game Board Component
 *
 * Main game board displaying the market, nobles, and bank.
 * Layout: | Tier Decks | Market Cards | Gem Bank | Nobles |
 */

import { GemColor } from '@splendubious/rules-engine';
import { ClientGameState, CardDisplay } from '../../types';
import { DevelopmentCard, DeckCard } from './DevelopmentCard';
import { GemToken } from './GemToken';
import { NobleTile } from './NobleTile';
import { ActionPanel } from './ActionPanel';
import { useGame } from '../../context';

const GEM_COLORS: GemColor[] = ['emerald', 'diamond', 'sapphire', 'onyx', 'ruby'];
const ALL_GEMS: (GemColor | 'gold')[] = [...GEM_COLORS, 'gold'];

interface GameBoardProps {
  gameState: ClientGameState;
}

export function GameBoard({ gameState }: GameBoardProps): JSX.Element {
  const { state, selectGem, selectCard } = useGame();
  const { selectedAction } = state;

  // Check if a card is purchasable
  const isCardPurchasable = (card: CardDisplay): boolean => {
    if (!gameState.availableActions) return false;
    const { purchasableCards } = gameState.availableActions;
    return purchasableCards.marketCards.includes(card.id);
  };

  // Check if a card is reservable
  const isCardReservable = (card: CardDisplay): boolean => {
    if (!gameState.availableActions?.reservableCards.canReserve) return false;
    return gameState.availableActions.reservableCards.marketCards.includes(card.id);
  };

  // Check if deck can be reserved from
  const canReserveFromDeck = (tier: 1 | 2 | 3): boolean => {
    if (!gameState.availableActions?.reservableCards.canReserve) return false;
    return gameState.availableActions.reservableCards.blindDrawTiers.includes(tier);
  };

  // Check if a gem can be taken
  const canTakeGem = (gem: GemColor): boolean => {
    if (!gameState.availableActions) return false;
    const bankCount = gameState.bank[gem] || 0;
    if (bankCount === 0) return false;
    
    const { takeGems } = gameState.availableActions;
    
    // If already selected 3 different gems, disable all further selection
    if (selectedAction.type === 'take_gems' && selectedAction.gems.length >= 3) {
      return false;
    }
    
    // If already selected 2 of the same gem, disable all further selection
    if (selectedAction.type === 'take_gems' && selectedAction.gems.length === 2 && 
        selectedAction.gems[0] === selectedAction.gems[1]) {
      return false;
    }
    
    // If selecting for two same gems (second selection of same gem)
    if (selectedAction.type === 'take_gems' && selectedAction.gems.length === 1 && selectedAction.gems[0] === gem) {
      return takeGems.availableForTwo.includes(gem);
    }
    
    // If selecting for three different gems
    if (selectedAction.type === 'take_gems' && selectedAction.gems.length > 0) {
      if (selectedAction.gems.includes(gem)) return false; // Can't take same gem twice for 3-different
      return takeGems.canTakeThree && takeGems.availableForThree.includes(gem);
    }
    
    // Initial selection - can take any available gem
    return (takeGems.canTakeThree && takeGems.availableForThree.includes(gem)) ||
           takeGems.availableForTwo.includes(gem);
  };

  // Check if player is eligible for a noble
  const isNobleEligible = (nobleId: string): boolean => {
    if (!gameState.availableActions?.mustSelectNoble) return false;
    return gameState.availableActions.selectableNobles.includes(nobleId);
  };

  // Handle gem click
  const handleGemClick = (gem: GemColor) => {
    if (canTakeGem(gem)) {
      selectGem(gem);
    }
  };

  // Handle card click for purchase
  const handleCardClick = (card: CardDisplay) => {
    if (isCardPurchasable(card)) {
      selectCard(card.id, true);
    } else if (isCardReservable(card)) {
      selectCard(card.id, false);
    }
  };

  // Handle deck click for reserve
  const handleDeckClick = (tier: 1 | 2 | 3) => {
    if (canReserveFromDeck(tier)) {
      // Select for reserve from deck (cardId = null means from deck)
      selectCard(`deck_tier${tier}`, false);
    }
  };

  // Selected gems display
  const selectedGems = selectedAction.type === 'take_gems' ? selectedAction.gems : [];
  
  // Check if a gem is currently selected
  const isGemSelected = (gem: GemColor): boolean => {
    return selectedGems.includes(gem);
  };
  
  // Check if a card is currently selected
  const isCardSelected = (cardId: string): boolean => {
    return (selectedAction.type === 'purchase_card' && selectedAction.cardId === cardId) ||
           (selectedAction.type === 'reserve_card' && selectedAction.cardId === cardId);
  };

  return (
    <div className="game-board">
      {/* Card Market with Tier Decks inline */}
      <div className="card-market">
        <div className="board-section-label">DEVELOPMENT CARDS</div>
        {/* Tier 3 - Top row */}
        <div className="market-row tier-3">
          <DeckCard
            tier={3}
            count={gameState.deckCounts.tier3}
            onClick={() => handleDeckClick(3)}
            canReserve={canReserveFromDeck(3)}
          />
          {gameState.market.tier3.map((card, index) => (
            card ? (
              <DevelopmentCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card)}
                canPurchase={isCardPurchasable(card)}
                canReserve={isCardReservable(card)}
                isSelected={isCardSelected(card.id)}
              />
            ) : (
              <div key={`empty-3-${index}`} className="card-slot empty" />
            )
          ))}
        </div>

        {/* Tier 2 - Middle row */}
        <div className="market-row tier-2">
          <DeckCard
            tier={2}
            count={gameState.deckCounts.tier2}
            onClick={() => handleDeckClick(2)}
            canReserve={canReserveFromDeck(2)}
          />
          {gameState.market.tier2.map((card, index) => (
            card ? (
              <DevelopmentCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card)}
                canPurchase={isCardPurchasable(card)}
                canReserve={isCardReservable(card)}
                isSelected={isCardSelected(card.id)}
              />
            ) : (
              <div key={`empty-2-${index}`} className="card-slot empty" />
            )
          ))}
        </div>

        {/* Tier 1 - Bottom row */}
        <div className="market-row tier-1">
          <DeckCard
            tier={1}
            count={gameState.deckCounts.tier1}
            onClick={() => handleDeckClick(1)}
            canReserve={canReserveFromDeck(1)}
          />
          {gameState.market.tier1.map((card, index) => (
            card ? (
              <DevelopmentCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card)}
                canPurchase={isCardPurchasable(card)}
                canReserve={isCardReservable(card)}
                isSelected={isCardSelected(card.id)}
              />
            ) : (
              <div key={`empty-1-${index}`} className="card-slot empty" />
            )
          ))}
        </div>
      </div>

      {/* Gem Bank - Right-Center */}
      <div className="gem-bank-section">
        <div className="board-section-label">GEMS</div>
        <div className="gem-bank">
          {ALL_GEMS.map((gem) => {
            const isGold = gem === 'gold';
            return (
              <div key={gem} className="gem-stack" data-gem-bank={gem}>
                <GemToken
                  color={gem}
                  count={gameState.bank[gem] || 0}
                  onClick={isGold ? undefined : () => handleGemClick(gem)}
                  isDisabled={isGold || (!isGold && !canTakeGem(gem))}
                  isSelected={!isGold && isGemSelected(gem)}
                  size="large"
                />
                {/* Show selection indicator */}
                {!isGold && selectedGems.filter(g => g === gem).length > 0 && (
                  <div className="gem-selected-indicator">
                    +{selectedGems.filter(g => g === gem).length}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Nobles - Far Right */}
      <div className="nobles-area">
        <div className="board-section-label">NOBLES</div>
        {gameState.nobles.map((noble) => (
          <NobleTile
            key={noble.id}
            noble={noble}
            isEligible={isNobleEligible(noble.id)}
          />
        ))}
      </div>

      {/* Action Panel - Bottom Right */}
      <div className="action-panel-area">
        <ActionPanel />
      </div>
    </div>
  );
}
