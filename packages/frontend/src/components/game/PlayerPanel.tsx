/**
 * Player Panel Component
 *
 * Displays a player's current state - gems, bonuses, cards, points.
 */

import { GemColor } from '@splendubious/rules-engine';
import { ClientPlayerState } from '../../types';
import { GemToken } from './GemToken';
import { NobleTile } from './NobleTile';
import { useGame } from '../../context';

const GEM_COLORS: GemColor[] = ['emerald', 'diamond', 'sapphire', 'onyx', 'ruby'];

interface PlayerPanelProps {
  player: ClientPlayerState;
  isCurrentPlayer: boolean;
  isLocalPlayer: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'opponent';
}

export function PlayerPanel({
  player,
  isCurrentPlayer,
  isLocalPlayer,
  position = 'bottom',
}: PlayerPanelProps): JSX.Element {
  const { 
    state, 
    selectGemForDiscard, 
    deselectGemFromDiscard, 
    mustDiscardGems,
    gemsToDiscard,
    selectCard,
  } = useGame();
  
  const { selectedAction, gameState } = state;
  const isDiscardMode = mustDiscardGems() && isLocalPlayer;
  const requiredDiscards = gemsToDiscard();
  
  // Check if a reserved card is purchasable (only for local player)
  const isReservedCardPurchasable = (cardId: string): boolean => {
    if (!isLocalPlayer || !gameState?.availableActions) return false;
    return gameState.availableActions.purchasableCards.reservedCards.includes(cardId);
  };
  
  // Handle clicking a reserved card
  const handleReservedCardClick = (cardId: string) => {
    if (isReservedCardPurchasable(cardId)) {
      selectCard(cardId, true); // true = for purchase
    }
  };
  
  // Check if a reserved card is selected
  const isReservedCardSelected = (cardId: string): boolean => {
    return selectedAction.type === 'purchase_card' && selectedAction.cardId === cardId;
  };
  
  // Get selected discard count for a gem color
  const getSelectedDiscardCount = (color: GemColor | 'gold'): number => {
    if (selectedAction.type !== 'discard_gems') return 0;
    return selectedAction.gems[color] || 0;
  };
  
  // Calculate total selected for discard
  const totalSelectedForDiscard = selectedAction.type === 'discard_gems'
    ? Object.values(selectedAction.gems).reduce((sum, count) => sum + (count || 0), 0)
    : 0;
  
  // Handle clicking a gem in discard mode
  const handleGemClick = (color: GemColor | 'gold') => {
    if (!isDiscardMode) return;
    
    const playerGemCount = color === 'gold' ? (player.gems.gold || 0) : (player.gems[color] || 0);
    const selectedCount = getSelectedDiscardCount(color);
    
    // Can only select up to the amount the player has
    if (selectedCount < playerGemCount && totalSelectedForDiscard < requiredDiscards) {
      selectGemForDiscard(color);
    }
  };
  
  // Handle right-clicking to deselect a gem
  const handleGemRightClick = (e: React.MouseEvent, color: GemColor | 'gold') => {
    e.preventDefault();
    if (!isDiscardMode) return;
    
    const selectedCount = getSelectedDiscardCount(color);
    if (selectedCount > 0) {
      deselectGemFromDiscard(color);
    }
  };

  // Group purchased cards by bonus color
  const cardsByBonus = GEM_COLORS.reduce((acc, color) => {
    acc[color] = player.purchasedCards.filter(card => card.bonus === color);
    return acc;
  }, {} as Record<GemColor, typeof player.purchasedCards>);

  // Calculate total gems for local player display
  const totalGems = Object.values(player.gems).reduce((sum, count) => sum + count, 0);

  return (
    <div 
      className={`player-panel ${isCurrentPlayer ? 'current-turn' : ''} ${isLocalPlayer ? 'local-player' : ''} position-${position}`}
      data-player-panel={player.id}
    >
      {/* Player header */}
      <div className="player-header">
        <div className="player-name">
          {player.name}
          {isLocalPlayer && <span className="you-indicator"> (You)</span>}
          {isLocalPlayer && (
            <span className={`gem-count-badge ${totalGems >= 10 ? 'at-limit' : totalGems >= 8 ? 'warning' : ''}`}>
              💎 {totalGems}/10
            </span>
          )}
        </div>
        <div className="player-prestige">
          <span className="prestige-value">{player.prestigePoints}</span>
          <span className="prestige-label">pts</span>
        </div>
        {isCurrentPlayer && (
          <div className="turn-indicator">🎯</div>
        )}
      </div>

      {/* Player resources - Gems and Cards aligned by color, with reserved cards on the right */}
      <div className="player-cards-section">
        <div className="player-cards-row">
          {/* Purchased cards grid - always render all gem colors for animation targets */}
          <div className={`player-resources-grid ${isDiscardMode ? 'discard-mode' : ''}`}>
        {GEM_COLORS.map((color) => {
          const gemCount = player.gems[color] || 0;
          const cards = cardsByBonus[color];
          const selectedForDiscard = getSelectedDiscardCount(color);
          
          return (
            <div key={color} className="color-column">
              {/* Gem slot for this color - always rendered for animation targeting */}
              <div 
                className={`column-gem ${isDiscardMode && gemCount > 0 ? 'clickable' : ''} ${selectedForDiscard > 0 ? 'selected-for-discard' : ''}`}
                onClick={() => handleGemClick(color)}
                onContextMenu={(e) => handleGemRightClick(e, color)}
                title={isDiscardMode && gemCount > 0 ? `Click to select for discard${selectedForDiscard > 0 ? ', right-click to deselect' : ''}` : undefined}
                data-player-gem={`${player.id}-${color}`}
              >
                {gemCount > 0 ? (
                  <>
                    <GemToken color={color} count={gemCount} size="small" />
                    {selectedForDiscard > 0 && (
                      <span className="discard-badge">-{selectedForDiscard}</span>
                    )}
                  </>
                ) : (
                  <div className="gem-placeholder" />
                )}
              </div>
              
              {/* Cards for this color - with data attribute for animation targeting */}
              <div className="column-cards" data-player-cards={`${player.id}-${color}`}>
                {cards.length > 0 && (
                  <div className="card-stack">
                    {cards.map((card, index) => (
                      <div 
                        key={card.id} 
                        className={`purchased-card tier-${card.tier}`}
                        style={{ marginTop: index > 0 ? '-55px' : 0, zIndex: index }}
                      >
                        <div className="purchased-card-header">
                          {card.prestigePoints > 0 && (
                            <span className="card-prestige">{card.prestigePoints}</span>
                          )}
                          <span className={`card-bonus gem-${card.bonus}`} />
                        </div>
                        <div className="purchased-card-cost">
                          {GEM_COLORS.map((gem) => {
                            const cost = card.cost[gem];
                            if (!cost || cost === 0) return null;
                            return (
                              <span key={gem} className={`cost-pip gem-${gem}`}>{cost}</span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Gold gems slot - always rendered for animation targeting */}
        {(() => {
          const goldCount = player.gems.gold || 0;
          const selectedGoldForDiscard = getSelectedDiscardCount('gold');
          return (
            <div className="color-column gold-column">
              <div 
                className={`column-gem ${isDiscardMode && goldCount > 0 ? 'clickable' : ''} ${selectedGoldForDiscard > 0 ? 'selected-for-discard' : ''}`}
                onClick={() => handleGemClick('gold')}
                onContextMenu={(e) => handleGemRightClick(e, 'gold')}
                title={isDiscardMode && goldCount > 0 ? `Click to select for discard${selectedGoldForDiscard > 0 ? ', right-click to deselect' : ''}` : undefined}
                data-player-gem={`${player.id}-gold`}
              >
                {goldCount > 0 ? (
                  <>
                    <GemToken color="gold" count={goldCount} size="small" />
                    {selectedGoldForDiscard > 0 && (
                      <span className="discard-badge">-{selectedGoldForDiscard}</span>
                    )}
                  </>
                ) : (
                  <div className="gem-placeholder" />
                )}
              </div>
              <div className="column-cards" />
            </div>
          );
        })()}
        </div>

        {/* Reserved Cards - visible to all players, purchasable by local player */}
        {player.reservedCards && player.reservedCards.length > 0 && (
          <div className="player-reserved" data-player-reserved={player.id}>
            <div className="section-label">Reserved ({player.reservedCards.length}/3)</div>
            <div className="reserved-cards">
              {player.reservedCards.map((card) => {
                const canPurchase = isReservedCardPurchasable(card.id);
                const isSelected = isReservedCardSelected(card.id);
                return (
                  <div 
                    key={card.id} 
                    className={`reserved-card tier-${card.tier} ${canPurchase ? 'purchasable' : ''} ${isSelected ? 'selected' : ''} ${isLocalPlayer && !canPurchase ? 'disabled' : ''}`}
                    onClick={() => handleReservedCardClick(card.id)}
                    role={canPurchase ? 'button' : undefined}
                    tabIndex={canPurchase ? 0 : undefined}
                  >
                    <div className="reserved-card-header">
                      {card.prestigePoints > 0 && <span className="card-prestige">{card.prestigePoints}</span>}
                      <span className={`card-bonus gem-${card.bonus}`} />
                    </div>
                    <div className="reserved-card-cost">
                      {GEM_COLORS.map((gem) => {
                        const cost = card.cost[gem];
                        if (!cost || cost === 0) return null;
                        return (
                          <span key={gem} className={`cost-pip gem-${gem}`}>{cost}</span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Nobles */}
      {player.nobles.length > 0 && (
        <div className="player-nobles">
          <div className="section-label">Nobles</div>
          <div className="nobles-row">
            {player.nobles.map((noble) => (
              <NobleTile
                key={noble.id}
                noble={noble}
                isEligible={false}
                size="small"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
