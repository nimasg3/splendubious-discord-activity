/**
 * Development Card Component
 *
 * Displays a single development card.
 */

import { CardDisplay } from '../../types';
import { GemColor } from '@splendubious/rules-engine';

interface DevelopmentCardProps {
  card: CardDisplay;
  canPurchase: boolean;
  canReserve: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const GEM_COLORS: GemColor[] = ['emerald', 'diamond', 'sapphire', 'onyx', 'ruby'];

export function DevelopmentCard({
  card,
  canPurchase,
  canReserve,
  isSelected,
  onClick,
}: DevelopmentCardProps): JSX.Element {
  const isInteractive = canPurchase || canReserve;
  
  return (
    <div
      className={`development-card tier-${card.tier} ${isSelected ? 'selected' : ''} ${canPurchase ? 'purchasable' : ''} ${!isInteractive ? 'disabled' : ''}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {/* Top row: Prestige points and bonus */}
      <div className="card-header">
        <span className="card-prestige">
          {card.prestigePoints > 0 ? card.prestigePoints : ''}
        </span>
        <span className={`card-bonus gem-indicator gem-${card.bonus}`} />
      </div>
      
      {/* Bottom: Gem costs */}
      <div className="card-costs">
        {GEM_COLORS.map((gem) => {
          const cost = card.cost[gem];
          if (!cost || cost === 0) return null;
          return (
            <div key={gem} className={`card-cost gem-${gem}`}>
              <span className="cost-value">{cost}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Face-down card for deck display
 */
interface DeckCardProps {
  tier: 1 | 2 | 3;
  count: number;
  onClick?: () => void;
  canReserve?: boolean;
}

export function DeckCard({ tier, count, onClick, canReserve = false }: DeckCardProps): JSX.Element {
  return (
    <div
      className={`deck-card tier-${tier} ${canReserve ? 'reservable' : ''}`}
      onClick={canReserve ? onClick : undefined}
      role={canReserve ? 'button' : undefined}
      tabIndex={canReserve ? 0 : undefined}
    >
      <span className="deck-tier">{['I', 'II', 'III'][tier - 1]}</span>
      <span className="deck-count">{count}</span>
    </div>
  );
}
