/**
 * Development Card Component
 *
 * Displays a single development card.
 */

import { CardDisplay } from '../../types';
import { GemColor } from '@splendubious/rules-engine';
import { useEffect, useRef, useState } from 'react';
import { COIN_IMAGE, COIN_SCALE } from './GemToken';

interface DevelopmentCardProps {
  card: CardDisplay;
  canPurchase: boolean;
  canReserve: boolean;
  isSelected: boolean;
  onClick: () => void;
  slotIndex?: number; // Position in the market row (0-3)
}

const GEM_COLORS: GemColor[] = ['emerald', 'diamond', 'sapphire', 'onyx', 'ruby'];

// =============================================================================
// CARD ART IMAGE HELPERS
// =============================================================================

const CARD_IMAGE_FOLDER: Record<GemColor, string> = {
  sapphire: '/cards/blue_cards/blue',
  onyx:     '/cards/black_cards/black',
  emerald:  '/cards/green_cards/green',
  ruby:     '/cards/red_cards/red',
  diamond:  '/cards/white_cards/white',
};

// Cumulative card count before each tier, per color group
// Tier 1: 8 cards (indices 0–7), Tier 2: 6 cards (indices 8–13), Tier 3: 4 cards (indices 14–17)
const TIER_OFFSET: Record<1 | 2 | 3, number> = { 1: 0, 2: 8, 3: 14 };

/**
 * Returns a deterministic card art image path for the given card.
 * Assigns images in round-robin fashion across the 10 available images per color,
 * keyed by the card's sequential position within its color group.
 */
export function getCardImage(cardId: string, bonus: GemColor, tier: 1 | 2 | 3): string {
  const match = cardId.match(/(\d+)$/);
  const cardNum = match ? parseInt(match[1]!, 10) : 1;
  const globalIndex = TIER_OFFSET[tier] + (cardNum - 1);
  const imageNum = (globalIndex % 10) + 1;
  return `${CARD_IMAGE_FOLDER[bonus]}${imageNum}.png`;
}

export const GEM_IMAGE: Record<GemColor | 'gold', string> = {
  emerald: '/cards/gems/green_gem.png',
  diamond: '/cards/gems/white_gem.png',
  sapphire: '/cards/gems/blue_gem.png',
  onyx: '/cards/gems/black_gem.png',
  ruby: '/cards/gems/red_gem.png',
  gold: '/cards/gems/gold_gem.png',
};

function GemIcon({ gem, className }: { gem: GemColor | 'gold'; className?: string }) {
  return (
    <img
      src={GEM_IMAGE[gem]}
      alt={gem}
      className={className}
      draggable={false}
    />
  );
}

export function DevelopmentCard({
  card,
  canPurchase,
  canReserve,
  isSelected,
  onClick,
  slotIndex,
}: DevelopmentCardProps): JSX.Element {
  const isInteractive = canPurchase || canReserve;
  
  return (
    <div
      className={`development-card tier-${card.tier} ${isSelected ? 'selected' : ''} ${canPurchase ? 'purchasable' : ''} ${!isInteractive ? 'disabled' : ''}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      data-card-id={card.id}
      data-tier={card.tier}
      data-slot-index={slotIndex}
    >
      <img
        className="card-bg-image"
        src={getCardImage(card.id, card.bonus, card.tier)}
        alt=""
        draggable={false}
      />
      {/* Top row: Prestige points and bonus */}
      <div className="card-header">
        <span className="card-prestige">
          {card.prestigePoints > 0 ? card.prestigePoints : ''}
        </span>
        <span className={`card-bonus gem-${card.bonus}`}>
          <GemIcon gem={card.bonus} className="card-bonus-gem-icon" />
        </span>
      </div>
      
      {/* Bottom: Gem costs */}
      <div className="card-costs">
        {GEM_COLORS.map((gem) => {
          const cost = card.cost[gem];
          if (!cost || cost === 0) return null;
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
              <span className="cost-value">{cost}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Face-down card for deck display
 */
interface DeckCardProps {
  tier: 1 | 2 | 3;
  count: number;
  onClick?: () => void;
  canReserve?: boolean;
}

export function DeckCard({ tier, count, onClick, canReserve = false }: DeckCardProps): JSX.Element {
  const prevCountRef = useRef(count);
  // When the last card is drawn (count drops from 1 → 0), keep showing the
  // card back for 400 ms so the deck-to-slot animation has time to start.
  const [showCard, setShowCard] = useState(count > 0);

  useEffect(() => {
    if (count > 0) {
      setShowCard(true);
      prevCountRef.current = count;
    } else if (prevCountRef.current === 1) {
      // Last card just drawn — hold the image briefly
      const t = setTimeout(() => setShowCard(false), 2000);
      prevCountRef.current = 0;
      return () => clearTimeout(t);
    } else {
      setShowCard(false);
      prevCountRef.current = 0;
    }
  }, [count]);

  // Show empty placeholder if deck is empty to preserve grid layout
  if (!showCard) {
    return (
      <div className={`deck-card tier-${tier} empty`}>
        {/* Empty deck placeholder - maintains grid layout */}
      </div>
    );
  }
  
  return (
    <div
      className={`deck-card tier-${tier} ${canReserve ? 'reservable' : ''}`}
      onClick={canReserve ? onClick : undefined}
      role={canReserve ? 'button' : undefined}
      tabIndex={canReserve ? 0 : undefined}
    >
      <img 
        src={`/cards/tier${tier}-back.png`} 
        alt={`Tier ${tier} deck`}
        className="deck-card-image"
      />
      {count > 0 && <span className="deck-count">{count}</span>}
    </div>
  );
}
