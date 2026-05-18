/**
 * Gem Token Component
 *
 * Displays a gem token (in bank or player area).
 */

import { GemColor } from '@splendubious/rules-engine';

export const COIN_IMAGE: Record<GemColor | 'gold', string> = {
  emerald: '/coins/green_coin.png',
  diamond: '/coins/white_coin.png',
  sapphire: '/coins/blue_coin.png',
  onyx: '/coins/black_coin.png',
  ruby: '/coins/red_coin.png',
  gold: '/coins/gold_coin.png',
};

export const COIN_SCALE: Record<GemColor | 'gold', string> = {
  emerald: '120%',
  diamond: '120%',
  sapphire: '130%',
  onyx: '125%',
  ruby: '125%',
  gold: '130%',
};

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
      <img
        src={COIN_IMAGE[color]}
        alt=""
        className={`gem-token-coin-img${size === 'large' ? ' gem-token-coin-img--blurred' : ''}`}
        style={{ transform: `scale(${parseFloat(COIN_SCALE[color]) / 100})` }}
        draggable={false}
      />
      <span className="gem-count">{count}</span>
    </button>
  );
}
