/**
 * Flying Gem and Card Components
 *
 * Renders animated gems and cards flying from board to player area.
 */

import { useEffect, useRef, useState } from 'react';
import { useAnimation } from '../../context/AnimationContext.js';
import { GemColor } from '@splendubious/rules-engine';
import { CardDisplay } from '../../types.js';
import { GEM_IMAGE, getCardImage } from './DevelopmentCard.js';
import { COIN_IMAGE, COIN_SCALE } from './GemToken.js';
import { playSound } from '../../sound/manager.js';

const GEM_COLOR_LIST: GemColor[] = ['emerald', 'diamond', 'sapphire', 'onyx', 'ruby'];

export function FlyingGems(): JSX.Element {
  const { flyingGems, flyingCards, flyingNobles, deckToSlotAnimations, deckReserveAnimations, removeAnimation, removeCardAnimation, removeNobleAnimation, removeDeckToSlotAnimation, removeDeckReserveAnimation } = useAnimation();

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
          cardId={card.cardId}
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
      {flyingNobles.map((noble) => (
        <FlyingNoble
          key={noble.id}
          id={noble.id}
          imageName={noble.imageName}
          startX={noble.startX}
          startY={noble.startY}
          endX={noble.endX}
          endY={noble.endY}
          size={noble.size}
          onComplete={() => removeNobleAnimation(noble.id)}
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
      {deckReserveAnimations.map((anim) => (
        <DeckReserveCard
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
          card={anim.card}
          onComplete={() => removeDeckReserveAnimation(anim.id)}
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

  const coinSrc = COIN_IMAGE[color as GemColor | 'gold'];
  const coinScale = parseFloat(COIN_SCALE[color as GemColor | 'gold'] || '100') / 100;

  return (
    <div ref={elementRef} className={`flying-gem gem-${color}`}>
      <img
        src={coinSrc}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${coinScale})` }}
      />
    </div>
  );
}

// =============================================================================
// FLYING CARD COMPONENT
// =============================================================================

interface FlyingCardProps {
  id: string;
  cardId: string;
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
  cardId,
  bonus,
  tier,
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
      <img className="card-bg-image" src={getCardImage(cardId, bonus, tier)} alt="" draggable={false} />
      <div className="flying-card-header">
        {prestigePoints > 0 && <span className="card-prestige">{prestigePoints}</span>}
        <span className={`card-bonus gem-${bonus}`}>
          <img src={GEM_IMAGE[bonus]} alt={bonus} className="card-bonus-gem-icon" draggable={false} />
        </span>
      </div>
      <div className="flying-card-cost">
        {GEM_COLOR_LIST.map((gem) => {
          const gemCost = cost[gem];
          if (!gemCost || gemCost === 0) return null;
          return (
            <span
              key={gem}
              className={`cost-pip gem-${gem}`}
              style={{
                backgroundImage: `url(${COIN_IMAGE[gem]})`,
                backgroundSize: COIN_SCALE[gem],
                backgroundPosition: 'center',
              }}
            >{gemCost}</span>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// FLYING NOBLE COMPONENT
// =============================================================================

interface FlyingNobleProps {
  id: string;
  imageName: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  onComplete: () => void;
}

function FlyingNoble({
  imageName,
  startX,
  startY,
  endX,
  endY,
  size,
  onComplete,
}: FlyingNobleProps): JSX.Element {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.style.left = `${startX}px`;
    element.style.top = `${startY}px`;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.transform = 'translate(-50%, -50%) scale(1)';
    element.style.opacity = '1';

    requestAnimationFrame(() => {
      element.style.left = `${endX}px`;
      element.style.top = `${endY}px`;
      element.style.transform = 'translate(-50%, -50%) scale(0)';
    });

    const fadeTimeout = setTimeout(() => {
      element.style.opacity = '0';
    }, 950);

    const timeout = setTimeout(onComplete, 2000);
    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(timeout);
    };
  }, [startX, startY, endX, endY, size, onComplete]);

  return (
    <div ref={elementRef} className="flying-noble">
      <img
        src={`/cards/nobles/${imageName}.png`}
        alt={imageName}
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
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
  scaleX: _scaleX,
  scaleY: _scaleY,
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
      playSound('card-flip');
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
      
      {/* Card front - wrapper fills the outer container which is already sized to the slot */}
      {newCard && (
        <div 
          className="flip-card-front-wrapper"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <div 
            className={`flip-card-front bonus-${newCard.bonus}`}
            style={{
              transform: `rotateY(${showFront ? '0deg' : '180deg'})`,
            }}
          >
            <img className="card-bg-image" src={getCardImage(newCard.id, newCard.bonus, newCard.tier)} alt="" draggable={false} />
            <div className="card-header">
              <span className="card-prestige">
                {newCard.prestigePoints > 0 ? newCard.prestigePoints : ''}
              </span>
              <span className={`card-bonus gem-${newCard.bonus}`}>
                <img src={GEM_IMAGE[newCard.bonus]} alt={newCard.bonus} className="card-bonus-gem-icon" draggable={false} />
              </span>
            </div>
            <div className="card-costs">
              {GEM_COLOR_LIST.map((gem) => {
                const gemCost = newCard.cost[gem];
                if (!gemCost || gemCost === 0) return null;
                return (
                  <div
                    key={gem}
                    className={`card-cost gem-${gem}`}
                    style={{
                      backgroundImage: `url(${COIN_IMAGE[gem]})`,
                      backgroundSize: COIN_SCALE[gem],
                      backgroundPosition: 'center',
                    }}
                  >
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

// =============================================================================
// DECK RESERVE CARD COMPONENT (flip in place at deck, then fly to player)
// =============================================================================

interface DeckReserveCardProps {
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
  card: CardDisplay;
  onComplete: () => void;
}

function DeckReserveCard({
  tier,
  startX,
  startY,
  endX,
  endY,
  width,
  height,
  scaleX: _scaleX,
  scaleY: _scaleY,
  card,
  onComplete,
}: DeckReserveCardProps): JSX.Element {
  const elementRef = useRef<HTMLDivElement>(null);
  const [showFront, setShowFront] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Initial state: at deck position, no position transition
    element.style.left = `${startX}px`;
    element.style.top = `${startY}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.transform = 'translate(-50%, -50%) scale(1)';
    element.style.opacity = '1';
    element.style.transition = 'none';

    // Phase 1: Flip to reveal card front after short paint delay
    const flipTimeout = setTimeout(() => {
      setShowFront(true);
      playSound('card-flip');
    }, 50);

    // Phase 2: After flip completes (~650ms), start flying to player
    const FLIP_DURATION = 700; // 50ms delay + 600ms flip + 50ms buffer
    const flyTimeout = setTimeout(() => {
      element.style.transition = [
        `left 1900ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
        `top 1900ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
        `transform 1900ms ease-in`,
      ].join(', ');
      element.style.left = `${endX}px`;
      element.style.top = `${endY}px`;
      element.style.transform = 'translate(-50%, -50%) scale(0)';
    }, FLIP_DURATION);

    // Fade out mid-flight
    const fadeTimeout = setTimeout(() => {
      element.style.opacity = '0';
      element.style.transition += ', opacity 950ms ease-in';
    }, FLIP_DURATION + 950);

    // Remove after full animation
    const completeTimeout = setTimeout(onComplete, FLIP_DURATION + 2000 + 100);

    return () => {
      clearTimeout(flipTimeout);
      clearTimeout(flyTimeout);
      clearTimeout(fadeTimeout);
      clearTimeout(completeTimeout);
    };
  }, [startX, startY, endX, endY, width, height, onComplete]);

  return (
    <div
      ref={elementRef}
      className={`deck-reserve-card tier-${tier} ${showFront ? 'show-front' : ''}`}
    >
      {/* Card back */}
      <div className="flip-card-back">
        <img
          src={`/cards/tier${tier}-back.png`}
          alt={`Tier ${tier} card back`}
          className="flip-card-image"
        />
      </div>

      {/* Card front */}
      <div
        className="flip-card-front-wrapper"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <div
          className={`flip-card-front bonus-${card.bonus}`}
          style={{
            transform: `rotateY(${showFront ? '0deg' : '180deg'})`,
          }}
        >
          <img className="card-bg-image" src={getCardImage(card.id, card.bonus, card.tier)} alt="" draggable={false} />
          <div className="card-header">
            <span className="card-prestige">
              {card.prestigePoints > 0 ? card.prestigePoints : ''}
            </span>
            <span className={`card-bonus gem-${card.bonus}`}>
              <img src={GEM_IMAGE[card.bonus]} alt={card.bonus} className="card-bonus-gem-icon" draggable={false} />
            </span>
          </div>
          <div className="card-costs">
            {GEM_COLOR_LIST.map((gem) => {
              const gemCost = card.cost[gem];
              if (!gemCost || gemCost === 0) return null;
              return (
                <div
                  key={gem}
                  className={`card-cost gem-${gem}`}
                  style={{
                    backgroundImage: `url(${COIN_IMAGE[gem]})`,
                    backgroundSize: COIN_SCALE[gem],
                    backgroundPosition: 'center',
                  }}
                >
                  <span className="cost-value">{gemCost}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
