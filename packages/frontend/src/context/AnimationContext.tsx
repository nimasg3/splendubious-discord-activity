/**
 * Animation Context
 *
 * Manages flying gem animations between game board and player panel.
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { GemColor } from '@splendubious/rules-engine';

// =============================================================================
// TYPES
// =============================================================================

interface FlyingGem {
  id: string;
  color: GemColor | 'gold';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startSize: number;
  endSize: number;
}

interface AnimationContextValue {
  flyingGems: FlyingGem[];
  animateGemsToPlayer: (gems: GemColor[], playerId: string) => void;
  removeAnimation: (id: string) => void;
}

// =============================================================================
// GLOBAL EVENT EMITTER FOR CROSS-CONTEXT COMMUNICATION
// =============================================================================

type AnimationEventHandler = (gems: GemColor[], playerId: string) => void;
const animationEventHandlers: Set<AnimationEventHandler> = new Set();

/**
 * Trigger gem animation from anywhere in the app
 * This allows GameContext to trigger animations without direct access to AnimationContext
 */
export function triggerGemAnimation(gems: GemColor[], playerId: string): void {
  animationEventHandlers.forEach(handler => handler(gems, playerId));
}

// =============================================================================
// CONTEXT
// =============================================================================

const AnimationContext = createContext<AnimationContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface AnimationProviderProps {
  children: ReactNode;
}

export function AnimationProvider({ children }: AnimationProviderProps): JSX.Element {
  const [flyingGems, setFlyingGems] = useState<FlyingGem[]>([]);

  const animateGemsToPlayer = useCallback((gems: GemColor[], playerId: string) => {
    // Group gems by color to handle taking 2 of the same
    const gemCounts = gems.reduce((acc, gem) => {
      acc[gem] = (acc[gem] || 0) + 1;
      return acc;
    }, {} as Record<GemColor, number>);

    const newAnimations: FlyingGem[] = [];

    Object.entries(gemCounts).forEach(([color, count]) => {
      // Find the source gem in the bank
      const sourceElement = document.querySelector(`[data-gem-bank="${color}"]`);
      // Find the target gem in the player panel
      const targetElement = document.querySelector(`[data-player-gem="${playerId}-${color}"]`);
      
      // Fallback to player panel header if gem doesn't exist yet
      const fallbackTarget = document.querySelector(`[data-player-panel="${playerId}"]`);

      if (sourceElement) {
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = (targetElement || fallbackTarget)?.getBoundingClientRect();

        if (targetRect) {
          // Create animation for each gem count with staggered timing
          for (let i = 0; i < count; i++) {
            // Stagger the animations slightly for multiple gems of same color
            const offset = i * 8; // Slight offset for visual separation
            newAnimations.push({
              id: `${color}-${Date.now()}-${i}`,
              color: color as GemColor,
              startX: sourceRect.left + sourceRect.width / 2 + offset,
              startY: sourceRect.top + sourceRect.height / 2 + offset,
              endX: targetRect.left + targetRect.width / 2,
              endY: targetRect.top + targetRect.height / 2,
              startSize: 56, // Large gem size
              endSize: 32,   // Small gem size
            });
          }
        }
      }
    });

    if (newAnimations.length > 0) {
      setFlyingGems(prev => [...prev, ...newAnimations]);
    }
  }, []);

  const removeAnimation = useCallback((id: string) => {
    setFlyingGems(prev => prev.filter(gem => gem.id !== id));
  }, []);

  // Register this provider's animation function to handle global events
  useEffect(() => {
    animationEventHandlers.add(animateGemsToPlayer);
    return () => {
      animationEventHandlers.delete(animateGemsToPlayer);
    };
  }, [animateGemsToPlayer]);

  return (
    <AnimationContext.Provider value={{ flyingGems, animateGemsToPlayer, removeAnimation }}>
      {children}
    </AnimationContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useAnimation(): AnimationContextValue {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider');
  }
  return context;
}
