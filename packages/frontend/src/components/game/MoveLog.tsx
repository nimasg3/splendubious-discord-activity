/**
 * Move Log Component
 *
 * Displays a running log of all game actions.
 */

import { useEffect, useRef, useState } from 'react';
import { PlayerAction, GemColor } from '@splendubious/rules-engine';
import { CardDisplay, NobleDisplay } from '../../types';
import * as socketClient from '../../socket/client.js';
import { GemToken, COIN_IMAGE, COIN_SCALE } from './GemToken.js';
import { GEM_IMAGE, getCardImage } from './DevelopmentCard.js';

const GEM_COLORS: GemColor[] = ['emerald', 'diamond', 'sapphire', 'onyx', 'ruby'];

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

interface LogCardInfo {
  id: string;
  bonus: GemColor;
  tier: 1 | 2 | 3;
  prestigePoints: number;
  cost: CardDisplay['cost'];
}

interface LogEntry {
  id: string;
  playerName: string;
  playerColor?: string;
  action: PlayerAction | { type: 'NOBLE_ACQUIRED'; playerId: string; nobleId: string };
  cardInfo?: LogCardInfo;
  nobleInfo?: NobleDisplay;
}

function LogGemToken({ gem, count }: { gem: GemColor | 'gold'; count: number }) {
  return (
    <span className="log-gem-token-wrap">
      <GemToken color={gem} count={count} size="small" />
    </span>
  );
}

function LogCardMini({ cardInfo }: { cardInfo: LogCardInfo }) {
  const costs = GEM_COLORS.filter((g) => (cardInfo.cost[g] ?? 0) > 0);
  return (
    <span className={`log-card-mini bonus-${cardInfo.bonus} tier-${cardInfo.tier}`}>
      <img className="card-bg-image" src={getCardImage(cardInfo.id, cardInfo.bonus, cardInfo.tier)} alt="" draggable={false} />
      <span className="log-card-mini-header">
        {cardInfo.prestigePoints > 0 && (
          <span className="log-card-mini-prestige">{cardInfo.prestigePoints}</span>
        )}
        <span className={`log-card-mini-bonus gem-${cardInfo.bonus}`}>
          <img src={GEM_IMAGE[cardInfo.bonus]} alt={cardInfo.bonus} className="log-card-mini-bonus-img" draggable={false} />
        </span>
      </span>
      {costs.length > 0 && (
        <span className="log-card-mini-costs">
          {costs.map((gem) => (
            <span
              key={gem}
              className={`log-cost-pip gem-${gem}`}
              style={{
                backgroundImage: `url(${COIN_IMAGE[gem]})`,
                backgroundSize: COIN_SCALE[gem],
                backgroundPosition: 'center',
              }}
            >
              {cardInfo.cost[gem]}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function LogNobleMini({ noble }: { noble: NobleDisplay }) {
  const imageName = nobleImageName(noble.requirements as Record<string, number>);
  return (
    <span className="log-noble-mini">
      <img
        src={`/cards/nobles/${imageName}.png`}
        alt={imageName}
        className="log-noble-mini-img"
        draggable={false}
      />
    </span>
  );
}

export function MoveLog(): JSX.Element {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track which nobles are on the board to detect auto-acquisitions
  const boardNobleIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsub = socketClient.onActionApplied((action, state) => {
      const player = state.players.find((p) => p.id === action.playerId);
      const playerName = player?.name ?? 'Unknown';
      const playerColor = state.playerColors?.[action.playerId];

      let cardInfo: LogCardInfo | undefined;
      if (action.type === 'PURCHASE_CARD') {
        const card = player?.purchasedCards.find((c) => c.id === action.cardId);
        if (card) cardInfo = { id: card.id, bonus: card.bonus, tier: card.tier, prestigePoints: card.prestigePoints, cost: card.cost };
      } else if (action.type === 'RESERVE_CARD' && action.cardId) {
        const card = player?.reservedCards?.find((c) => c.id === action.cardId);
        if (card) cardInfo = { id: card.id, bonus: card.bonus, tier: card.tier, prestigePoints: card.prestigePoints, cost: card.cost };
      }

      const newEntries: LogEntry[] = [];

      // Detect nobles acquired this action (covers auto-acquire and SELECT_NOBLE)
      const updatedBoardIds = new Set(state.nobles.map((n) => n.id));
      const acquiredIds = [...boardNobleIdsRef.current].filter((id) => !updatedBoardIds.has(id));
      for (const nobleId of acquiredIds) {
        const acquiringPlayer = state.players.find((p) => p.nobles.some((n) => n.id === nobleId));
        const nobleData = acquiringPlayer?.nobles.find((n) => n.id === nobleId);
        if (acquiringPlayer && nobleData) {
          newEntries.push({
            id: `noble-${nobleId}-${Date.now()}-${Math.random()}`,
            playerName: acquiringPlayer.name,
            playerColor: state.playerColors?.[acquiringPlayer.id],
            action: { type: 'NOBLE_ACQUIRED', playerId: acquiringPlayer.id, nobleId },
            nobleInfo: nobleData,
          });
        }
      }
      boardNobleIdsRef.current = updatedBoardIds;

      // Skip logging the SELECT_NOBLE action itself — covered by NOBLE_ACQUIRED above
      if (action.type !== 'SELECT_NOBLE') {
        newEntries.unshift({
          id: `${Date.now()}-${Math.random()}`,
          playerName,
          playerColor,
          action,
          cardInfo,
        });
      }

      setEntries((prev) => [...prev.slice(-(50 - newEntries.length)), ...newEntries]);
    });

    return unsub;
  }, []);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  function renderEntry(entry: LogEntry) {
    const { playerName, playerColor, action } = entry;
    const nameStyle = playerColor ? { color: playerColor } : undefined;

    if (action.type === 'NOBLE_ACQUIRED') {
      return (
        <>
          <span className="log-player-name" style={nameStyle}>{playerName}</span>
          <span className="log-verb"> attracted</span>
          {entry.nobleInfo && <LogNobleMini noble={entry.nobleInfo} />}
        </>
      );
    }

    if (action.type === 'TAKE_THREE_GEMS') {
      const gemCounts: Partial<Record<GemColor, number>> = {};
      for (const gem of action.gems) {
        gemCounts[gem] = (gemCounts[gem] ?? 0) + 1;
      }
      return (
        <>
          <span className="log-player-name" style={nameStyle}>{playerName}</span>
          <span className="log-verb"> took</span>
          <span className="log-gems-row">
            {(Object.entries(gemCounts) as [GemColor, number][]).map(([gem, count]) => (
              <LogGemToken key={gem} gem={gem} count={count} />
            ))}
          </span>
        </>
      );
    }

    if (action.type === 'TAKE_TWO_GEMS') {
      return (
        <>
          <span className="log-player-name" style={nameStyle}>{playerName}</span>
          <span className="log-verb"> took</span>
          <span className="log-gems-row">
            <LogGemToken gem={action.gem} count={2} />
          </span>
        </>
      );
    }

    if (action.type === 'PURCHASE_CARD') {
      return (
        <>
          <span className="log-player-name" style={nameStyle}>{playerName}</span>
          <span className="log-verb"> purchased</span>
          {entry.cardInfo ? (
            <LogCardMini cardInfo={entry.cardInfo} />
          ) : (
            <span className="log-verb"> a card</span>
          )}
        </>
      );
    }

    if (action.type === 'DISCARD_GEMS') {
      const gemEntries = (Object.entries(action.gems) as [GemColor, number][]).filter(([, count]) => count > 0);
      return (
        <>
          <span className="log-player-name" style={nameStyle}>{playerName}</span>
          <span className="log-verb"> discarded</span>
          <span className="log-gems-row">
            {gemEntries.map(([gem, count]) => (
              <LogGemToken key={gem} gem={gem} count={count} />
            ))}
          </span>
        </>
      );
    }

    if (action.type === 'RESERVE_CARD') {
      return (
        <>
          <span className="log-player-name" style={nameStyle}>{playerName}</span>
          <span className="log-verb"> reserved</span>
          {entry.cardInfo ? (
            <LogCardMini cardInfo={entry.cardInfo} />
          ) : (
            <span className="log-verb"> a card</span>
          )}
        </>
      );
    }

    return null;
  }

  return (
    <div className="move-log">
      <div className="move-log-header">Log</div>
      <div className="move-log-entries" ref={scrollRef}>
        {entries.length === 0 ? (
          <div className="move-log-empty">No moves yet</div>
        ) : (
          entries.map((entry) => {
            const content = renderEntry(entry);
            if (!content) return null;
            return (
              <div key={entry.id} className="move-log-entry">
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
