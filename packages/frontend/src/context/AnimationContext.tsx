/**
 * Animation Context
 *
 * Manages flying gem and card animations between game board and player panel.
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { GemColor } from '@splendubious/rules-engine';
import { CardDisplay } from '../types.js';

// =============================================================================
// HELPERS
// =============================================================================

const GEM_COLOR_NAMES: Record<GemColor, string> = {
  diamond: 'white',
  sapphire: 'blue',
  emerald: 'green',
  ruby: 'red',
  onyx: 'black',
};

const NOBLE_COLOR_ORDER: GemColor[] = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx'];

function nobleImageName(requirements: Record<string, number>): string {
  return NOBLE_COLOR_ORDER
    .filter((gem) => (requirements[gem] ?? 0) > 0)
    .map((gem) => `${requirements[gem]}${GEM_COLOR_NAMES[gem]}`)
    .join('_');
}

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

interface FlyingCard {
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
  animationType: 'purchase' | 'reserve';
}

// Animation for card coming from deck to fill empty slot
interface DeckToSlotAnimation {
  id: string;
  tier: 1 | 2 | 3;
  slotIndex: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  phase: 'moving' | 'flipping' | 'done';
  newCard: CardDisplay | null; // The card to reveal after flip
}

// Animation for card reserved from deck (flip in place, then fly to player)
interface DeckReserveAnimation {
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
}

interface FlyingNoble {
  id: string;
  nobleId: string;
  imageName: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
}

interface AnimationContextValue {
  flyingGems: FlyingGem[];
  flyingCards: FlyingCard[];
  flyingNobles: FlyingNoble[];
  deckToSlotAnimations: DeckToSlotAnimation[];
  deckReserveAnimations: DeckReserveAnimation[];
  animatingSlots: Set<string>; // Set of "tier-index" keys for slots that should appear empty
  animateGemsToPlayer: (gems: GemColor[], playerId: string) => void;
  animateCardToPlayer: (cardId: string, playerId: string, animationType: 'purchase' | 'reserve', cardInfo: { bonus: GemColor; tier: 1 | 2 | 3; prestigePoints: number; cost: Partial<Record<GemColor, number>> }) => void;
  removeAnimation: (id: string) => void;
  removeCardAnimation: (id: string) => void;
  startSlotAnimation: (tier: 1 | 2 | 3, slotIndex: number, cardId: string) => void;
  triggerDeckToSlotAnimation: (tier: 1 | 2 | 3, slotIndex: number, newCard: CardDisplay | null) => void;
  removeDeckToSlotAnimation: (id: string) => void;
  removeDeckReserveAnimation: (id: string) => void;
  removeNobleAnimation: (id: string) => void;
  isSlotAnimating: (tier: 1 | 2 | 3, slotIndex: number) => boolean;
}

// =============================================================================
// GLOBAL EVENT EMITTER FOR CROSS-CONTEXT COMMUNICATION
// =============================================================================

type AnimationEventHandler = (gems: GemColor[], playerId: string) => void;
type CardAnimationEventHandler = (cardId: string, playerId: string, animationType: 'purchase' | 'reserve', cardInfo: { bonus: GemColor; tier: 1 | 2 | 3; prestigePoints: number; cost: Partial<Record<GemColor, number>> }) => void;
type SlotAnimationStartHandler = (tier: 1 | 2 | 3, slotIndex: number, cardId: string) => void;
type DeckToSlotAnimationHandler = (tier: 1 | 2 | 3, slotIndex: number, newCard: CardDisplay | null) => void;
type DeckReserveAnimationHandler = (tier: 1 | 2 | 3, playerId: string, card: CardDisplay) => void;
type NobleAnimationEventHandler = (nobleId: string, playerId: string, requirements: Record<string, number>) => void;

const animationEventHandlers: Set<AnimationEventHandler> = new Set();
const cardAnimationEventHandlers: Set<CardAnimationEventHandler> = new Set();
const slotAnimationStartHandlers: Set<SlotAnimationStartHandler> = new Set();
const deckToSlotAnimationHandlers: Set<DeckToSlotAnimationHandler> = new Set();
const deckReserveAnimationHandlers: Set<DeckReserveAnimationHandler> = new Set();
const nobleAnimationEventHandlers: Set<NobleAnimationEventHandler> = new Set();

// Track board noble requirements so image names can be computed at animation time
const boardNobles: Map<string, Record<string, number>> = new Map();

export function syncBoardNobleData(nobles: Array<{ id: string; requirements: Record<string, number> }>): void {
  boardNobles.clear();
  nobles.forEach((n) => boardNobles.set(n.id, n.requirements));
}

export function getBoardNobleIds(): Set<string> {
  return new Set(boardNobles.keys());
}

export function triggerNobleAnimation(nobleId: string, playerId: string, requirements: Record<string, number>): void {
  nobleAnimationEventHandlers.forEach((handler) => handler(nobleId, playerId, requirements));
}

/**
 * Trigger gem animation from anywhere in the app
 * This allows GameContext to trigger animations without direct access to AnimationContext
 */
export function triggerGemAnimation(gems: GemColor[], playerId: string): void {
  animationEventHandlers.forEach(handler => handler(gems, playerId));
}

// Store pending card positions for animations (captured before state changes)
const pendingCardPositions: Map<string, { x: number; y: number; width: number; height: number }> = new Map();

// Store pending slot info (tier + index) for cards being animated
const pendingSlotInfo: Map<string, { tier: 1 | 2 | 3; slotIndex: number }> = new Map();

// Store deck element positions for deck-reserve animations (captured before action is sent)
const pendingDeckPositions: Map<number, { x: number; y: number; width: number; height: number }> = new Map();

/**
 * Store the deck card's position for a tier before initiating a deck-reserve action
 */
export function storeDeckPositionForAnimation(tier: 1 | 2 | 3): void {
  const deckElement = document.querySelector(`.deck-card.tier-${tier}`);
  if (deckElement) {
    const rect = deckElement.getBoundingClientRect();
    pendingDeckPositions.set(tier, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    });
  }
}

/**
 * Trigger a deck-reserve animation (flip at deck then fly to player)
 */
export function triggerDeckReserveAnimation(tier: 1 | 2 | 3, playerId: string, card: CardDisplay): void {
  deckReserveAnimationHandlers.forEach(handler => handler(tier, playerId, card));
}

/**
 * Store a card's position and slot info before initiating an action
 * Call this before sending purchase/reserve action to server
 */
export function storeCardPositionForAnimation(cardId: string): void {
  const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
  if (cardElement) {
    const rect = cardElement.getBoundingClientRect();
    pendingCardPositions.set(cardId, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    });
    
    // Also store the slot info based on data attributes
    const slotIndex = cardElement.getAttribute('data-slot-index');
    const tier = cardElement.getAttribute('data-tier');
    if (slotIndex !== null && tier !== null) {
      pendingSlotInfo.set(cardId, {
        tier: parseInt(tier) as 1 | 2 | 3,
        slotIndex: parseInt(slotIndex),
      });
    }
  }
}

/**
 * Get stored slot info for a card
 */
export function getStoredSlotInfo(cardId: string): { tier: 1 | 2 | 3; slotIndex: number } | null {
  const info = pendingSlotInfo.get(cardId);
  if (info) {
    pendingSlotInfo.delete(cardId);
    return info;
  }
  return null;
}

/**
 * Mark a slot as animating (should appear empty)
 */
export function triggerSlotAnimationStart(tier: 1 | 2 | 3, slotIndex: number, cardId: string): void {
  slotAnimationStartHandlers.forEach(handler => handler(tier, slotIndex, cardId));
}

/**
 * Trigger deck-to-slot animation after flying card completes
 */
export function triggerDeckToSlotAnimation(tier: 1 | 2 | 3, slotIndex: number, newCard: CardDisplay | null): void {
  deckToSlotAnimationHandlers.forEach(handler => handler(tier, slotIndex, newCard));
}

/**
 * Get and remove a stored card position
 */
function getStoredCardPosition(cardId: string): { x: number; y: number; width: number; height: number } | null {
  const pos = pendingCardPositions.get(cardId);
  if (pos) {
    pendingCardPositions.delete(cardId);
    return pos;
  }
  return null;
}

/**
 * Trigger card animation from anywhere in the app
 */
export function triggerCardAnimation(
  cardId: string, 
  playerId: string, 
  animationType: 'purchase' | 'reserve',
  cardInfo: { bonus: GemColor; tier: 1 | 2 | 3; prestigePoints: number; cost: Partial<Record<GemColor, number>> }
): void {
  cardAnimationEventHandlers.forEach(handler => handler(cardId, playerId, animationType, cardInfo));
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
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
  const [flyingNobles, setFlyingNobles] = useState<FlyingNoble[]>([]);
  const [deckToSlotAnimations, setDeckToSlotAnimations] = useState<DeckToSlotAnimation[]>([]);;
  const [deckReserveAnimations, setDeckReserveAnimations] = useState<DeckReserveAnimation[]>([]);
  const [animatingSlots, setAnimatingSlots] = useState<Set<string>>(new Set());

  // Helper to create slot key
  const slotKey = (tier: 1 | 2 | 3, slotIndex: number) => `${tier}-${slotIndex}`;

  // Check if a slot is currently animating
  const isSlotAnimating = useCallback((tier: 1 | 2 | 3, slotIndex: number) => {
    return animatingSlots.has(slotKey(tier, slotIndex));
  }, [animatingSlots]);

  // Start slot animation (mark slot as empty)
  const startSlotAnimation = useCallback((tier: 1 | 2 | 3, slotIndex: number, _cardId: string) => {
    setAnimatingSlots(prev => new Set(prev).add(slotKey(tier, slotIndex)));
  }, []);

  // Trigger deck-to-slot animation
  const handleDeckToSlotAnimation = useCallback((tier: 1 | 2 | 3, slotIndex: number, newCard: CardDisplay | null) => {
    // If there's no new card (deck was empty), just clear the animating slot without animation
    if (!newCard) {
      setAnimatingSlots(prev => {
        const next = new Set(prev);
        next.delete(slotKey(tier, slotIndex));
        return next;
      });
      return;
    }
    
    // Find the deck and slot positions
    const deckElement = document.querySelector(`.deck-card.tier-${tier}`);
    const slotElement = document.querySelector(`[data-card-slot="${tier}-${slotIndex}"]`);
    
    if (deckElement && slotElement) {
      const deckRect = deckElement.getBoundingClientRect();
      const slotRect = slotElement.getBoundingClientRect();
      
      const newAnimation: DeckToSlotAnimation = {
        id: `deck-to-slot-${tier}-${slotIndex}-${Date.now()}`,
        tier,
        slotIndex,
        startX: deckRect.left + deckRect.width / 2,
        startY: deckRect.top + deckRect.height / 2,
        endX: slotRect.left + slotRect.width / 2,
        endY: slotRect.top + slotRect.height / 2,
        width: deckRect.width,
        height: deckRect.height,
        scaleX: 1,
        scaleY: 1,
        phase: 'moving',
        newCard,
      };
      
      setDeckToSlotAnimations(prev => [...prev, newAnimation]);
    } else {
      // If we can't find elements, just clear the animating slot
      setAnimatingSlots(prev => {
        const next = new Set(prev);
        next.delete(slotKey(tier, slotIndex));
        return next;
      });
    }
  }, []);

  // Remove deck-to-slot animation and clear animating slot
  const removeDeckToSlotAnimation = useCallback((id: string) => {
    setDeckToSlotAnimations(prev => {
      const animation = prev.find(a => a.id === id);
      if (animation) {
        // Clear the animating slot when animation is done
        setAnimatingSlots(slots => {
          const next = new Set(slots);
          next.delete(slotKey(animation.tier, animation.slotIndex));
          return next;
        });
      }
      return prev.filter(a => a.id !== id);
    });
  }, []);

  // Trigger deck-reserve animation (flip at deck then fly to player)
  const handleDeckReserveAnimation = useCallback((tier: 1 | 2 | 3, playerId: string, card: CardDisplay) => {
    // Use stored position if available, otherwise read from DOM now
    const storedPos = pendingDeckPositions.get(tier);
    pendingDeckPositions.delete(tier);

    const deckElement = document.querySelector(`.deck-card.tier-${tier}`);
    const deckRect = storedPos ? null : deckElement?.getBoundingClientRect();
    const startX = storedPos ? storedPos.x : (deckRect ? deckRect.left + deckRect.width / 2 : 0);
    const startY = storedPos ? storedPos.y : (deckRect ? deckRect.top + deckRect.height / 2 : 0);
    const width = storedPos ? storedPos.width : (deckRect ? deckRect.width : 155);
    const height = storedPos ? storedPos.height : (deckRect ? deckRect.height : 215);

    const targetElement = document.querySelector(`[data-player-reserved="${playerId}"]`)
      || document.querySelector(`[data-player-panel="${playerId}"]`);
    const targetRect = targetElement?.getBoundingClientRect();
    if (!targetRect) return;

    const newAnim: DeckReserveAnimation = {
      id: `deck-reserve-${tier}-${Date.now()}`,
      tier,
      startX,
      startY,
      endX: targetRect.left + targetRect.width / 2,
      endY: targetRect.top + targetRect.height / 2,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      card,
    };
    setDeckReserveAnimations(prev => [...prev, newAnim]);
  }, []);

  const removeDeckReserveAnimation = useCallback((id: string) => {
    setDeckReserveAnimations(prev => prev.filter(a => a.id !== id));
  }, []);

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

  const animateCardToPlayer = useCallback((
    cardId: string, 
    playerId: string, 
    animationType: 'purchase' | 'reserve',
    cardInfo: { bonus: GemColor; tier: 1 | 2 | 3; prestigePoints: number; cost: Partial<Record<GemColor, number>> }
  ) => {
    // Try to get stored position first (captured before action was sent)
    const storedPosition = getStoredCardPosition(cardId);
    
    // If no stored position, try to find the card in DOM (fallback)
    let sourceX: number, sourceY: number, sourceWidth: number, sourceHeight: number;
    
    if (storedPosition) {
      sourceX = storedPosition.x;
      sourceY = storedPosition.y;
      sourceWidth = storedPosition.width;
      sourceHeight = storedPosition.height;
    } else {
      // Fallback: try to find the card in DOM
      const sourceElement = document.querySelector(`[data-card-id="${cardId}"]`);
      if (!sourceElement) return; // Can't animate without source
      const sourceRect = sourceElement.getBoundingClientRect();
      sourceX = sourceRect.left + sourceRect.width / 2;
      sourceY = sourceRect.top + sourceRect.height / 2;
      sourceWidth = sourceRect.width;
      sourceHeight = sourceRect.height;
    }
    
    // Find the target based on animation type
    let targetElement: Element | null = null;
    if (animationType === 'purchase') {
      // Target the purchased cards column for this bonus color
      targetElement = document.querySelector(`[data-player-cards="${playerId}-${cardInfo.bonus}"]`);
    } else {
      // Target the reserved cards section
      targetElement = document.querySelector(`[data-player-reserved="${playerId}"]`);
    }
    
    // Fallback to player panel if target not found
    const fallbackTarget = document.querySelector(`[data-player-panel="${playerId}"]`);
    const targetRect = (targetElement || fallbackTarget)?.getBoundingClientRect();

    if (targetRect) {
      const newAnimation: FlyingCard = {
        id: `card-${cardId}-${Date.now()}`,
        cardId,
        bonus: cardInfo.bonus,
        tier: cardInfo.tier,
        prestigePoints: cardInfo.prestigePoints,
        cost: cardInfo.cost,
        startX: sourceX,
        startY: sourceY,
        endX: targetRect.left + targetRect.width / 2,
        endY: targetRect.top + targetRect.height / 2,
        startWidth: sourceWidth || 130,
        startHeight: sourceHeight || 180,
        endWidth: 60,
        endHeight: 80,
        animationType,
      };

      setFlyingCards(prev => [...prev, newAnimation]);
    }
  }, []);

  const removeAnimation = useCallback((id: string) => {
    setFlyingGems(prev => prev.filter(gem => gem.id !== id));
  }, []);

  const removeCardAnimation = useCallback((id: string) => {
    setFlyingCards(prev => prev.filter(card => card.id !== id));
  }, []);

  const animateNobleToPlayer = useCallback((nobleId: string, playerId: string, requirements: Record<string, number>) => {
    const sourceElement = document.querySelector(`[data-noble-board="${nobleId}"]`);
    const targetElement =
      document.querySelector(`[data-player-nobles="${playerId}"]`) ||
      document.querySelector(`[data-player-panel="${playerId}"]`);
    if (!sourceElement || !targetElement) return;

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const imageName = nobleImageName(requirements);

    setFlyingNobles((prev) => [
      ...prev,
      {
        id: `noble-${nobleId}-${Date.now()}`,
        nobleId,
        imageName,
        startX: sourceRect.left + sourceRect.width / 2,
        startY: sourceRect.top + sourceRect.height / 2,
        endX: targetRect.left + targetRect.width / 2,
        endY: targetRect.top + targetRect.height / 2,
        size: sourceRect.width,
      },
    ]);
  }, []);

  const removeNobleAnimation = useCallback((id: string) => {
    setFlyingNobles((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Register this provider's animation function to handle global events
  useEffect(() => {
    animationEventHandlers.add(animateGemsToPlayer);
    cardAnimationEventHandlers.add(animateCardToPlayer);
    slotAnimationStartHandlers.add(startSlotAnimation);
    deckToSlotAnimationHandlers.add(handleDeckToSlotAnimation);
    deckReserveAnimationHandlers.add(handleDeckReserveAnimation);
    nobleAnimationEventHandlers.add(animateNobleToPlayer);
    return () => {
      animationEventHandlers.delete(animateGemsToPlayer);
      cardAnimationEventHandlers.delete(animateCardToPlayer);
      slotAnimationStartHandlers.delete(startSlotAnimation);
      deckToSlotAnimationHandlers.delete(handleDeckToSlotAnimation);
      deckReserveAnimationHandlers.delete(handleDeckReserveAnimation);
      nobleAnimationEventHandlers.delete(animateNobleToPlayer);
    };
  }, [animateGemsToPlayer, animateCardToPlayer, startSlotAnimation, handleDeckToSlotAnimation, handleDeckReserveAnimation, animateNobleToPlayer]);

  return (
    <AnimationContext.Provider value={{ 
      flyingGems, 
      flyingCards,
      flyingNobles,
      deckToSlotAnimations,
      deckReserveAnimations,
      animatingSlots,
      animateGemsToPlayer, 
      animateCardToPlayer,
      removeAnimation,
      removeCardAnimation,
      startSlotAnimation,
      triggerDeckToSlotAnimation: handleDeckToSlotAnimation,
      removeDeckToSlotAnimation,
      removeDeckReserveAnimation,
      removeNobleAnimation,
      isSlotAnimating,
    }}>
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
