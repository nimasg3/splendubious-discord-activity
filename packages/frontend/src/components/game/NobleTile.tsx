/**
 * Noble Tile Component
 *
 * Displays a noble tile.
 */

import { NobleDisplay } from '../../types';
import { GemColor } from '@splendubious/rules-engine';

interface NobleTileProps {
  noble: NobleDisplay;
  isEligible: boolean;
  onClick?: () => void;
}

const GEM_COLORS: GemColor[] = ['emerald', 'diamond', 'sapphire', 'onyx', 'ruby'];

export function NobleTile({
  noble,
  isEligible,
  onClick,
}: NobleTileProps): JSX.Element {
  return (
    <div
      className={`noble-tile ${isEligible ? 'eligible' : ''}`}
      onClick={isEligible ? onClick : undefined}
      role={isEligible ? 'button' : undefined}
      tabIndex={isEligible ? 0 : undefined}
    >
      {/* Prestige points (always 3 for nobles) */}
      <div className="noble-prestige">{noble.prestigePoints}</div>
      
      {/* Requirements */}
      <div className="noble-requirements">
        {GEM_COLORS.map((gem) => {
          const requirement = noble.requirements[gem];
          if (!requirement || requirement === 0) return null;
          return (
            <div key={gem} className={`noble-requirement gem-${gem}`}>
              <span className="requirement-value">{requirement}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
