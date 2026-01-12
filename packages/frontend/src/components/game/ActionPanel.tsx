/**
 * Action Panel Component
 *
 * UI for selecting and confirming player actions.
 */

import { useGame } from '../../context';
import { GemColor } from '@splendubious/rules-engine';
import { GemToken } from './GemToken';

export function ActionPanel(): JSX.Element {
  const { 
    state, 
    clearSelection, 
    takeThreeGems, 
    takeTwoGems, 
    reserveCard, 
    purchaseCard,
    selectNoble,
    discardGems,
    deselectGem,
    isMyTurn,
    getMyPlayer,
  } = useGame();

  const { selectedAction, gameState } = state;
  const myPlayer = getMyPlayer();
  const availableActions = gameState?.availableActions;
  const isCurrentTurn = isMyTurn();

  // Calculate total gems player has
  const totalPlayerGems = myPlayer 
    ? Object.values(myPlayer.gems).reduce((sum, count) => sum + count, 0)
    : 0;

  // Check if player must discard gems (over 10 limit)
  const mustDiscardGems = availableActions?.mustDiscardGems === true;
  const gemsToDiscard = availableActions?.gemsToDiscard ?? 0;

  // Handle confirm action
  const handleConfirm = async () => {
    if (selectedAction.type === 'none') return;

    try {
      switch (selectedAction.type) {
        case 'take_gems':
          // Check if taking 2 of the same gem
          if (selectedAction.gems.length === 2 && selectedAction.gems[0] === selectedAction.gems[1]) {
            const gem = selectedAction.gems[0];
            if (gem) {
              console.log('Taking 2 same gems:', gem);
              await takeTwoGems(gem);
            }
          } else if (selectedAction.gems.length >= 1 && selectedAction.gems.length <= 3) {
            // Taking 1-3 different gems
            console.log('Taking gems:', selectedAction.gems);
            await takeThreeGems(selectedAction.gems);
          } else {
            console.log('Invalid gem selection:', selectedAction.gems);
          }
          break;
        case 'purchase_card':
          await purchaseCard(selectedAction.cardId);
          break;
        case 'reserve_card':
          if (selectedAction.cardId?.startsWith('deck_tier')) {
            // Reserve from deck
            await reserveCard(null, selectedAction.tier);
          } else {
            await reserveCard(selectedAction.cardId, selectedAction.tier);
          }
          break;
        case 'select_noble':
          await selectNoble(selectedAction.nobleId);
          break;
        case 'discard_gems':
          await discardGems(selectedAction.gems);
          break;
      }
      clearSelection();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  // Check if current selection is valid for confirmation
  const canConfirm = (): boolean => {
    if (selectedAction.type === 'none') return false;
    
    switch (selectedAction.type) {
      case 'take_gems':
        // Valid: 1-3 different gems OR 2 same gems
        if (selectedAction.gems.length >= 1 && selectedAction.gems.length <= 3) {
          const unique = new Set(selectedAction.gems);
          // Either all different (1-3 different gems) or exactly 2 same
          if (unique.size === selectedAction.gems.length) {
            return true; // All different
          }
          if (selectedAction.gems.length === 2 && unique.size === 1) {
            return true; // 2 same gems
          }
        }
        return false;
      case 'purchase_card':
      case 'reserve_card':
      case 'select_noble':
        return true;
      case 'discard_gems':
        const totalDiscard = Object.values(selectedAction.gems).reduce((sum, count) => sum + (count || 0), 0);
        return totalDiscard === gemsToDiscard;
      default:
        return false;
    }
  };

  // Render selection status
  const renderSelectionStatus = () => {
    switch (selectedAction.type) {
      case 'none':
        if (mustDiscardGems) {
          return (
            <div className="selection-status discard-required">
              <span className="status-icon">⚠️</span>
              <span>You must discard {gemsToDiscard} gem{gemsToDiscard > 1 ? 's' : ''}</span>
            </div>
          );
        }
        if (!isCurrentTurn) {
          return (
            <div className="selection-status waiting">
              <span className="status-icon">⏳</span>
              <span>Waiting for other player...</span>
            </div>
          );
        }
        return (
          <div className="selection-status ready">
            <span className="status-icon">🎯</span>
            <span>Your turn - Select an action</span>
          </div>
        );

      case 'take_gems':
        const gemCount = selectedAction.gems.length;
        if (gemCount === 0) {
          return (
            <div className="selection-status selecting">
              <span>Select gems from the bank (1-3 different, or 2 same)</span>
            </div>
          );
        }
        if (gemCount === 1) {
          return (
            <div className="selection-status ready">
              <span>Ready to take 1 gem (or select more)</span>
            </div>
          );
        }
        if (gemCount === 2) {
          const isSame = selectedAction.gems[0] === selectedAction.gems[1];
          if (isSame) {
            return (
              <div className="selection-status ready">
                <span>Ready to take 2 {selectedAction.gems[0]} gems</span>
              </div>
            );
          }
          return (
            <div className="selection-status ready">
              <span>Ready to take 2 gems (or select 1 more)</span>
            </div>
          );
        }
        return (
          <div className="selection-status ready">
            <span>Ready to take 3 different gems</span>
          </div>
        );

      case 'purchase_card':
        return (
          <div className="selection-status ready">
            <span>Ready to purchase card</span>
          </div>
        );

      case 'reserve_card':
        return (
          <div className="selection-status ready">
            <span>Ready to reserve card</span>
          </div>
        );

      case 'select_noble':
        return (
          <div className="selection-status ready">
            <span>Select a noble to claim</span>
          </div>
        );

      case 'discard_gems':
        const discardCount = Object.values(selectedAction.gems).reduce((sum, count) => sum + (count || 0), 0);
        return (
          <div className="selection-status selecting">
            <span>Discarding {discardCount}/{gemsToDiscard} gems</span>
          </div>
        );

      default:
        return null;
    }
  };

  // Render selected gems preview
  const renderSelectedGems = () => {
    if (selectedAction.type !== 'take_gems' || selectedAction.gems.length === 0) {
      return null;
    }

    return (
      <div className="selected-gems-preview">
        {selectedAction.gems.map((gem, index) => (
          <button
            key={`${gem}-${index}`}
            className="selected-gem"
            onClick={() => deselectGem(gem)}
            aria-label={`Remove ${gem}`}
          >
            <GemToken color={gem} count={1} size="small" />
            <span className="remove-icon">×</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="action-panel">
      {/* Selection status */}
      {renderSelectionStatus()}

      {/* Selected gems preview */}
      {renderSelectedGems()}

      {/* Action buttons */}
      <div className="action-buttons">
        {selectedAction.type !== 'none' && (
          <>
            <button
              className="btn btn-secondary"
              onClick={clearSelection}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={!canConfirm()}
            >
              Confirm
            </button>
          </>
        )}
      </div>

      {/* Player gem count indicator */}
      {myPlayer && (
        <div className="gem-count-indicator">
          <span>Gems: {totalPlayerGems}/10</span>
          {totalPlayerGems >= 8 && (
            <span className="warning">
              {totalPlayerGems >= 10 ? ' (at limit!)' : ' (approaching limit)'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
