/**
 * ScalingWrapper Component
 *
 * Wraps the application and scales all content proportionally based on viewport size.
 * Uses 1920x1080 as the base resolution - the UI will scale to fill the viewport
 * while maintaining proportions.
 */

import { useEffect, useState, ReactNode } from 'react';

interface ScalingWrapperProps {
  children: ReactNode;
  baseWidth?: number;
  baseHeight?: number;
}

export function ScalingWrapper({
  children,
  baseWidth = 1920,
  baseHeight = 1080,
}: ScalingWrapperProps): JSX.Element {
  const [dimensions, setDimensions] = useState({ scaleX: 1, scaleY: 1 });

  useEffect(() => {
    const calculateScale = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Scale to fill the entire viewport
      const scaleX = windowWidth / baseWidth;
      const scaleY = windowHeight / baseHeight;

      setDimensions({ scaleX, scaleY });
    };

    // Calculate initial scale
    calculateScale();

    // Recalculate on window resize
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [baseWidth, baseHeight]);

  return (
    <div
      className="scaling-wrapper-container"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      <div
        className="scaling-wrapper-content"
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: `scale(${dimensions.scaleX}, ${dimensions.scaleY})`,
          transformOrigin: 'top left',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
