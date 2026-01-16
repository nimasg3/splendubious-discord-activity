/**
 * Flying Gem Component
 *
 * Renders animated gems flying from bank to player area.
 */

import { useEffect, useRef } from 'react';
import { useAnimation } from '../../context/AnimationContext.js';

const GEM_COLORS: Record<string, string> = {
  emerald: '#2ecc71',
  diamond: '#ecf0f1',
  sapphire: '#3498db',
  onyx: '#2c3e50',
  ruby: '#e74c3c',
  gold: '#f39c12',
};

export function FlyingGems(): JSX.Element {
  const { flyingGems, removeAnimation } = useAnimation();

  return (
    <div className="flying-gems-container">
      {flyingGems.map((gem) => (
        <FlyingGem
          key={gem.id}
          id={gem.id}
          color={gem.color}
          startX={gem.startX}
          startY={gem.startY}
          endX={gem.endX}
          endY={gem.endY}
          startSize={gem.startSize}
          endSize={gem.endSize}
          onComplete={() => removeAnimation(gem.id)}
        />
      ))}
    </div>
  );
}

interface FlyingGemProps {
  id: string;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startSize: number;
  endSize: number;
  onComplete: () => void;
}

function FlyingGem({
  color,
  startX,
  startY,
  endX,
  endY,
  startSize,
  endSize,
  onComplete,
}: FlyingGemProps): JSX.Element {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set initial position
    element.style.left = `${startX - startSize / 2}px`;
    element.style.top = `${startY - startSize / 2}px`;
    element.style.width = `${startSize}px`;
    element.style.height = `${startSize}px`;

    // Trigger animation after a brief delay
    requestAnimationFrame(() => {
      element.style.left = `${endX - endSize / 2}px`;
      element.style.top = `${endY - endSize / 2}px`;
      element.style.width = `${endSize}px`;
      element.style.height = `${endSize}px`;
      element.style.opacity = '0.8';
    });

    // Remove after animation completes
    const timeout = setTimeout(onComplete, 500);
    return () => clearTimeout(timeout);
  }, [startX, startY, endX, endY, startSize, endSize, onComplete]);

  return (
    <div
      ref={elementRef}
      className={`flying-gem gem-${color}`}
      style={{
        backgroundColor: GEM_COLORS[color] || '#888',
      }}
    />
  );
}
