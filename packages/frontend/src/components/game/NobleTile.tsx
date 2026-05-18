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
  size?: 'normal' | 'small';
}

const GEM_COLOR_NAMES: Record<GemColor, string> = {
  diamond: 'white',
  sapphire: 'blue',
  emerald: 'green',
  ruby: 'red',
  onyx: 'black',
};

// Canonical color order for consistent filename segment ordering
const COLOR_ORDER: GemColor[] = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx'];

function nobleImageName(requirements: Record<GemColor, number>): string {
  const entries = COLOR_ORDER
    .filter((gem) => (requirements[gem] ?? 0) > 0)
    .map((gem) => `${requirements[gem]}${GEM_COLOR_NAMES[gem]}`);
  return entries.join('_');
}

export function NobleTile({
  noble,
  isEligible,
  onClick,
  size = 'normal',
}: NobleTileProps): JSX.Element {
  const imageName = nobleImageName(noble.requirements);
  return (
    <div
      className={`noble-tile ${isEligible ? 'eligible' : ''} size-${size}`}
      onClick={isEligible ? onClick : undefined}
      role={isEligible ? 'button' : undefined}
      tabIndex={isEligible ? 0 : undefined}
    >
      <img
        className="noble-tile-image"
        src={`/cards/nobles/${imageName}.png`}
        alt={imageName}
        draggable={false}
      />
    </div>
  );
}
