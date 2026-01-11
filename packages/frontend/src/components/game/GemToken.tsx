/**
 * Gem Token Component
 *
 * Displays a gem token (in bank or player area).
 */

import { GemColor } from '@splendubious/rules-engine';

interface GemTokenProps {
  color: GemColor | 'gold';
  count: number;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function GemToken({
  color,
  count,
  isSelected = false,
  isDisabled = false,
  onClick,
  size = 'medium',
}: GemTokenProps): JSX.Element {
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={`gem-token gem-${color} size-${size} ${isSelected ? 'selected' : ''}`}
      disabled={isDisabled || count === 0}
      onClick={handleClick}
      aria-label={`${color} gems: ${count}`}
    >
      <span className="gem-count">{count}</span>
    </button>
  );
}
