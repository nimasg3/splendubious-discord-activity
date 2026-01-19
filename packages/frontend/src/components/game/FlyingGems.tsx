/**
 * Flying Gem and Card Components
 *
 * Renders animated gems and cards flying from board to player area.
 */

import { useEffect, useRef, useState } from 'react';
import { useAnimation } from '../../context/AnimationContext.js';
import { GemColor } from '@splendubious/rules-engine';
import { CardDisplay } from '../../types.js';

const GEM_COLORS: Record<string, string> = {
  emerald: '#2ecc71',
  diamond: '#ecf0f1',
  sapphire: '#3498db',
  onyx: '#2c3e50',
  ruby: '#e74c3c',
  gold: '#f39c12',
};

const GEM_COLOR_LIST: GemColor[] = ['emerald', 'diamond', 'sapphire', 'onyx', 'ruby'];

export function FlyingGems(): JSX.Element {
  const { flyingGems, flyingCards, deckToSlotAnimations, removeAnimation, removeCardAnimation, removeDeckToSlotAnimation } = useAnimation();

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
      {flyingCards.map((card) => (
        <FlyingCard
          key={card.id}
          id={card.id}
          bonus={card.bonus}
          tier={card.tier}
          prestigePoints={card.prestigePoints}
          cost={card.cost}
          startX={card.startX}
          startY={card.startY}
          endX={card.endX}
          endY={card.endY}
          startWidth={card.startWidth}
          startHeight={card.startHeight}
          endWidth={card.endWidth}
          endHeight={card.endHeight}
          onComplete={() => removeCardAnimation(card.id)}
        />
      ))}
      {deckToSlotAnimations.map((anim) => (
        <DeckToSlotCard
          key={anim.id}
          id={anim.id}
          tier={anim.tier}
          startX={anim.startX}
          startY={anim.startY}
          endX={anim.endX}
          endY={anim.endY}
          width={anim.width}
          height={anim.height}
          scaleX={anim.scaleX}
          scaleY={anim.scaleY}
          newCard={anim.newCard}
          onComplete={() => removeDeckToSlotAnimation(anim.id)}
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
    element.style.opacity = '1';

    // Trigger position/size animation immediately - shrink to size 0
    requestAnimationFrame(() => {
      element.style.left = `${endX}px`;
      element.style.top = `${endY}px`;
      element.style.width = '0px';
      element.style.height = '0px';
    });

    // Delay fade to second half of animation (950ms into 1900ms animation)
    const fadeTimeout = setTimeout(() => {
      element.style.opacity = '0';
    }, 950);

    // Remove after animation completes
    const timeout = setTimeout(onComplete, 2000);
    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(timeout);
    };
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

// =============================================================================
// FLYING CARD COMPONENT
// =============================================================================

interface FlyingCardProps {
  id: string;
  bonus: GemColor;
  tier: 1 | 2 | 3;
  prestigePoints: number;
  cost: Partial<Record<GemColor, number>>;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startWidth: number;
  startHeight: number;
  endWidth: number;
  endHeight: number;
  onComplete: () => void;
}

function FlyingCard({
  bonus,
  tier: _tier,
  prestigePoints,
  cost,
  startX,
  startY,
  endX,
  endY,
  startWidth,
  startHeight,
  endWidth,
  endHeight,
  onComplete,
}: FlyingCardProps): JSX.Element {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set initial position and size (use transform for scaling so contents scale too)
    element.style.left = `${startX}px`;
    element.style.top = `${startY}px`;
    element.style.width = `${startWidth}px`;
    element.style.height = `${startHeight}px`;
    element.style.transform = 'translate(-50%, -50%) scale(1)';
    element.style.opacity = '1';

    // Trigger position animation and scale to 0
    requestAnimationFrame(() => {
      element.style.left = `${endX}px`;
      element.style.top = `${endY}px`;
      element.style.transform = 'translate(-50%, -50%) scale(0)';
    });

    // Delay fade to second half of animation (950ms into 1900ms animation)
    const fadeTimeout = setTimeout(() => {
      element.style.opacity = '0';
    }, 950);

    // Remove after animation completes
    const timeout = setTimeout(onComplete, 2000);
    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(timeout);
    };
  }, [startX, startY, endX, endY, startWidth, startHeight, endWidth, endHeight, onComplete]);

  return (
    <div
      ref={elementRef}
      className={`flying-card bonus-${bonus}`}
    >
      <div className="flying-card-header">
        {prestigePoints > 0 && <span className="card-prestige">{prestigePoints}</span>}
        <span className={`card-bonus gem-${bonus}`} />
      </div>
      <div className="flying-card-cost">
        {GEM_COLOR_LIST.map((gem) => {
          const gemCost = cost[gem];
          if (!gemCost || gemCost === 0) return null;
          return (
            <span key={gem} className={`cost-pip gem-${gem}`}>{gemCost}</span>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// DECK TO SLOT CARD COMPONENT (with flip animation)
// =============================================================================

interface DeckToSlotCardProps {
  id: string;
  tier: 1 | 2 | 3;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  newCard: CardDisplay | null;
  onComplete: () => void;
}

function DeckToSlotCard({
  tier,
  startX,
  startY,
  endX,
  endY,
  width,
  height,
  scaleX,
  scaleY,
  newCard,
  onComplete,
}: DeckToSlotCardProps): JSX.Element {
  const elementRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'moving' | 'flipping' | 'done'>('moving');
  const [showFront, setShowFront] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set initial position (at deck)
    element.style.left = `${startX}px`;
    element.style.top = `${startY}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.transform = 'translate(-50%, -50%)';

    // Trigger move animation
    requestAnimationFrame(() => {
      element.style.left = `${endX}px`;
      element.style.top = `${endY}px`;
    });

    // After move animation (800ms), start flip and show front simultaneously
    const flipStartTimeout = setTimeout(() => {
      setPhase('flipping');
      setShowFront(true);
    }, 800);

    // After flip completes, mark as done and cleanup
    const completeTimeout = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 800 + 600 + 100); // Move (800) + flip (600) + buffer (100)

    return () => {
      clearTimeout(flipStartTimeout);
      clearTimeout(completeTimeout);
    };
  }, [startX, startY, endX, endY, width, height, onComplete]);

  return (
    <div
      ref={elementRef}
      className={`deck-to-slot-card tier-${tier} phase-${phase} ${showFront ? 'show-front' : 'show-back'}`}
    >
      {/* Card back */}
      <div className="flip-card-back">
        <img 
          src={`/cards/tier${tier}-back.png`} 
          alt={`Tier ${tier} card back`}
          className="flip-card-image"
        />
      </div>
      
      {/* Card front - wrapper handles scale, inner handles rotation */}
      {newCard && (
        <div 
          className="flip-card-front-wrapper"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '130px',
            height: '180px',
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'top left',
          }}
        >
          <div 
            className={`flip-card-front bonus-${newCard.bonus}`}
            style={{
              transform: `rotateY(${showFront ? '0deg' : '180deg'})`,
            }}
          >
            <div className="card-header">
              <span className="card-prestige">
                {newCard.prestigePoints > 0 ? newCard.prestigePoints : ''}
              </span>
              <span className={`card-bonus gem-indicator gem-${newCard.bonus}`} />
            </div>
            <div className="card-costs">
              {GEM_COLOR_LIST.map((gem) => {
                const gemCost = newCard.cost[gem];
                if (!gemCost || gemCost === 0) return null;
                return (
                  <div key={gem} className={`card-cost gem-${gem}`}>
                    <span className="cost-value">{gemCost}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
