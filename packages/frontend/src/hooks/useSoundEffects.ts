/**
 * useSoundEffects hook
 *
 * Subscribes to socket events and fires the appropriate sound effect.
 * Mount once inside GameScreen.
 */

import { useEffect, useRef } from 'react';
import { useGame } from '../context/index.js';
import * as socketClient from '../socket/client.js';
import { playSound } from '../sound/manager.js';

export function useSoundEffects(): void {
  const { state } = useGame();
  const localPlayerId = state.user?.id;

  // Keep a ref so the action sound handler always has the latest localPlayerId
  const localPlayerIdRef = useRef<string | undefined>(localPlayerId);
  useEffect(() => {
    localPlayerIdRef.current = localPlayerId;
  }, [localPlayerId]);

  // Track previous turn player to detect turn changes
  const prevCurrentPlayerIdRef = useRef<string | null>(null);

  // Action sounds — only play for the local player's own actions
  useEffect(() => {
    const unsub = socketClient.onActionApplied((action, _state) => {
      if (action.playerId !== localPlayerIdRef.current) return;
      switch (action.type) {
        case 'TAKE_THREE_GEMS':
        case 'TAKE_TWO_GEMS':
          playSound('gem-take');
          break;
        case 'DISCARD_GEMS':
          playSound('gem-discard');
          break;
        case 'PURCHASE_CARD':
          playSound('card-purchase');
          break;
        case 'RESERVE_CARD':
          playSound('card-reserve');
          break;
        case 'SELECT_NOBLE':
          playSound('noble');
          break;
      }
    });
    return unsub;
  }, []);

  // "Your turn" sound — fires when it becomes the local player's turn
  useEffect(() => {
    if (!state.gameState) return;
    const currentPlayer = state.gameState.players[state.gameState.currentPlayerIndex];
    const currentPlayerId = currentPlayer?.id ?? null;

    if (
      currentPlayerId !== prevCurrentPlayerIdRef.current &&
      currentPlayerId === localPlayerId
    ) {
      playSound('your-turn');
    }
    prevCurrentPlayerIdRef.current = currentPlayerId;
  }, [state.gameState?.currentPlayerIndex, localPlayerId]);

  // Win/lose sound — fires once when the game ends
  const hasPlayedEndRef = useRef(false);
  useEffect(() => {
    if (!state.gameState) return;
    const winners: string[] = state.gameState.winners ?? [];
    if (winners.length > 0 && !hasPlayedEndRef.current) {
      hasPlayedEndRef.current = true;
      if (winners.includes(localPlayerId ?? '')) {
        playSound('player-win');
      } else {
        playSound('player-lose');
      }
    }
  }, [state.gameState?.winners, localPlayerId]);
}
