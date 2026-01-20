/**
 * Game Context
 *
 * React context for game state management.
 */

import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { PlayerAction, GemColor, CardTier } from '@splendubious/rules-engine';
import {
  ClientGameState,
  RoomStateDTO,
  SelectedAction,
  AppScreen,
  DiscordUser,
} from '../types';
import * as socketClient from '../socket/client.js';
import { triggerGemAnimation, triggerCardAnimation, storeCardPositionForAnimation, getStoredSlotInfo, triggerSlotAnimationStart, triggerDeckToSlotAnimation } from './AnimationContext.js';

// =============================================================================
// STATE TYPES
// =============================================================================

interface GameContextState {
  // App state
  screen: AppScreen;
  isLoading: boolean;
  error: string | null;

  // User state
  user: DiscordUser | null;
  isHost: boolean;

  // Room state
  room: RoomStateDTO | null;

  // Game state
  gameState: ClientGameState | null;

  // UI state
  selectedAction: SelectedAction;
}

// =============================================================================
// ACTIONS
// =============================================================================

type GameContextAction =
  | { type: 'SET_SCREEN'; screen: AppScreen }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_USER'; user: DiscordUser }
  | { type: 'UPDATE_USER_ID'; id: string }
  | { type: 'UPDATE_USER_NAME'; name: string }
  | { type: 'SET_HOST'; isHost: boolean }
  | { type: 'SET_ROOM'; room: RoomStateDTO | null }
  | { type: 'ADD_PLAYER_TO_ROOM'; player: import('../types').PlayerDTO }
  | { type: 'REMOVE_PLAYER_FROM_ROOM'; playerId: string }
  | { type: 'SET_GAME_STATE'; gameState: ClientGameState }
  | { type: 'SET_SELECTED_ACTION'; action: SelectedAction }
  | { type: 'ADD_SELECTED_GEM'; gem: GemColor }
  | { type: 'REMOVE_SELECTED_GEM'; gem: GemColor }
  | { type: 'ADD_GEM_TO_DISCARD'; gem: GemColor | 'gold' }
  | { type: 'REMOVE_GEM_FROM_DISCARD'; gem: GemColor | 'gold' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'RESET' };

// =============================================================================
// REDUCER
// =============================================================================

function gameReducer(
  state: GameContextState,
  action: GameContextAction
): GameContextState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'UPDATE_USER_ID':
      if (!state.user) return state;
      return { 
        ...state, 
        user: { ...state.user, id: action.id }
      };
    case 'UPDATE_USER_NAME':
      if (!state.user) return state;
      return { 
        ...state, 
        user: { ...state.user, globalName: action.name, username: action.name }
      };
    case 'SET_HOST':
      return { ...state, isHost: action.isHost };
    case 'SET_ROOM':
      return { 
        ...state, 
        room: action.room,
        isHost: action.room ? action.room.hostId === state.user?.id : false,
      };
    case 'ADD_PLAYER_TO_ROOM':
      if (!state.room) return state;
      // Check if player already exists
      if (state.room.players.some(p => p.id === action.player.id)) {
        return state;
      }
      return {
        ...state,
        room: {
          ...state.room,
          players: [...state.room.players, action.player],
        },
      };
    case 'REMOVE_PLAYER_FROM_ROOM':
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          players: state.room.players.filter(p => p.id !== action.playerId),
        },
      };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.gameState };
    case 'SET_SELECTED_ACTION':
      return { ...state, selectedAction: action.action };
    case 'ADD_SELECTED_GEM': {
      if (state.selectedAction.type === 'take_gems') {
        const gems = [...state.selectedAction.gems, action.gem];
        return { ...state, selectedAction: { type: 'take_gems', gems } };
      }
      return { ...state, selectedAction: { type: 'take_gems', gems: [action.gem] } };
    }
    case 'REMOVE_SELECTED_GEM': {
      if (state.selectedAction.type === 'take_gems') {
        const currentGems = state.selectedAction.gems;
        const lastIndex = currentGems.lastIndexOf(action.gem);
        const gems = currentGems.filter((_, i) => i !== lastIndex);
        if (gems.length === 0) {
          return { ...state, selectedAction: { type: 'none' } };
        }
        return { ...state, selectedAction: { type: 'take_gems', gems } };
      }
      return state;
    }
    case 'ADD_GEM_TO_DISCARD': {
      if (state.selectedAction.type === 'discard_gems') {
        const currentGems = { ...state.selectedAction.gems };
        currentGems[action.gem] = (currentGems[action.gem] || 0) + 1;
        return { ...state, selectedAction: { type: 'discard_gems', gems: currentGems } };
      }
      // Start new discard selection
      return { ...state, selectedAction: { type: 'discard_gems', gems: { [action.gem]: 1 } } };
    }
    case 'REMOVE_GEM_FROM_DISCARD': {
      if (state.selectedAction.type === 'discard_gems') {
        const currentGems = { ...state.selectedAction.gems };
        const count = currentGems[action.gem] || 0;
        if (count > 1) {
          currentGems[action.gem] = count - 1;
        } else {
          delete currentGems[action.gem];
        }
        // If no gems selected, clear selection
        const totalSelected = Object.values(currentGems).reduce((sum, c) => sum + (c || 0), 0);
        if (totalSelected === 0) {
          return { ...state, selectedAction: { type: 'none' } };
        }
        return { ...state, selectedAction: { type: 'discard_gems', gems: currentGems } };
      }
      return state;
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedAction: { type: 'none' } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface GameContextValue {
  state: GameContextState;

  // Navigation
  setScreen: (screen: AppScreen) => void;

  // User actions
  setLocalPlayerName: (name: string) => void;

  // Room actions
  createRoom: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  startGame: (playerCount: 2 | 3 | 4) => Promise<void>;
  updatePlayerName: (name: string) => Promise<void>;

  // Game actions
  takeThreeGems: (gems: GemColor[]) => Promise<void>;
  takeTwoGems: (gem: GemColor) => Promise<void>;
  reserveCard: (cardId: string | null, tier: CardTier) => Promise<void>;
  purchaseCard: (cardId: string) => Promise<void>;
  selectNoble: (nobleId: string) => Promise<void>;
  discardGems: (gems: Partial<Record<GemColor | 'gold', number>>) => Promise<void>;

  // UI actions
  selectGem: (gem: GemColor) => void;
  deselectGem: (gem: GemColor) => void;
  selectGemForDiscard: (gem: GemColor | 'gold') => void;
  deselectGemFromDiscard: (gem: GemColor | 'gold') => void;
  selectCard: (cardId: string, forPurchase: boolean) => void;
  clearSelection: () => void;

  // Utility
  isMyTurn: () => boolean;
  getMyPlayer: () => ClientGameState['players'][0] | null;
  mustDiscardGems: () => boolean;
  gemsToDiscard: () => number;
}

const GameContext = createContext<GameContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize socket connection and subscriptions
  useEffect(() => {
    // Connect to server (use VITE_SOCKET_URL env var, or fallback to localhost for dev)
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    socketClient.connect(serverUrl);
    
    // Subscribe to events
    const unsubRoom = socketClient.onRoomUpdated((room) => {
      dispatch({ type: 'SET_ROOM', room });
    });
    
    const unsubPlayerJoined = socketClient.onPlayerJoined((player) => {
      dispatch({ type: 'ADD_PLAYER_TO_ROOM', player });
    });
    
    const unsubPlayerLeft = socketClient.onPlayerLeft((playerId) => {
      dispatch({ type: 'REMOVE_PLAYER_FROM_ROOM', playerId });
    });
    
    const unsubGameState = socketClient.onGameStateUpdated((gameState) => {
      dispatch({ type: 'SET_GAME_STATE', gameState });
    });
    
    const unsubGameStarted = socketClient.onGameStarted((gameState) => {
      dispatch({ type: 'SET_GAME_STATE', gameState });
      dispatch({ type: 'SET_SCREEN', screen: 'game' });
    });
    
    const unsubGameEnded = socketClient.onGameEnded((_winners) => {
      // Game ended - state should already be updated
    });
    
    // Subscribe to action applied events for animations
    const unsubActionApplied = socketClient.onActionApplied((action, updatedState) => {
      // Helper to get slot info from stored data or DOM
      const getSlotInfoForCard = (cardId: string): { tier: 1 | 2 | 3; slotIndex: number } | null => {
        // First try stored slot info (for local player's actions)
        const storedInfo = getStoredSlotInfo(cardId);
        if (storedInfo) return storedInfo;
        
        // Fallback: find the card in the DOM (for non-local player's actions)
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
          const tier = cardElement.getAttribute('data-tier');
          const slotIndex = cardElement.getAttribute('data-slot-index');
          if (tier && slotIndex) {
            return {
              tier: parseInt(tier) as 1 | 2 | 3,
              slotIndex: parseInt(slotIndex),
            };
          }
        }
        return null;
      };

      // Trigger gem animation when any player takes gems
      if (action.type === 'TAKE_THREE_GEMS') {
        triggerGemAnimation(action.gems, action.playerId);
      } else if (action.type === 'TAKE_TWO_GEMS') {
        // For taking 2 of the same gem, create an array with that gem twice
        triggerGemAnimation([action.gem, action.gem], action.playerId);
      } else if (action.type === 'PURCHASE_CARD') {
        // Get the slot info from stored data or DOM
        const slotInfo = getSlotInfoForCard(action.cardId);
        
        // Find the card info from the player's purchased cards in the updated state
        const player = updatedState.players.find(p => p.id === action.playerId);
        const card = player?.purchasedCards.find(c => c.id === action.cardId);
        if (card) {
          // Mark the slot as animating (will show as empty)
          if (slotInfo) {
            triggerSlotAnimationStart(slotInfo.tier, slotInfo.slotIndex, action.cardId);
          }
          
          triggerCardAnimation(action.cardId, action.playerId, 'purchase', {
            bonus: card.bonus,
            tier: card.tier,
            prestigePoints: card.prestigePoints,
            cost: card.cost,
          });
          
          // After flying card animation completes, trigger deck-to-slot animation
          // Only animate if there are cards left in the deck
          if (slotInfo) {
            const deckCount = slotInfo.tier === 1 ? updatedState.deckCounts.tier1
                            : slotInfo.tier === 2 ? updatedState.deckCounts.tier2
                            : updatedState.deckCounts.tier3;
            if (deckCount > 0) {
            setTimeout(() => {
              // Find the new card that's now in this slot from the updated state
              const marketTier = slotInfo.tier === 1 ? updatedState.market.tier1 
                               : slotInfo.tier === 2 ? updatedState.market.tier2 
                               : updatedState.market.tier3;
              const newCard = marketTier[slotInfo.slotIndex] || null;
              triggerDeckToSlotAnimation(slotInfo.tier, slotInfo.slotIndex, newCard);
            }, 2000); // Wait for flying card animation to complete
            } else {
              // No cards in deck, just clear the animating slot after the flying card animation
              setTimeout(() => {
                triggerDeckToSlotAnimation(slotInfo.tier, slotInfo.slotIndex, null);
              }, 2000);
            }
          }
        }
      } else if (action.type === 'RESERVE_CARD' && action.cardId) {
        // Get the slot info from stored data or DOM
        const slotInfo = getSlotInfoForCard(action.cardId);
        
        // Find the card info from the player's reserved cards in the updated state
        const player = updatedState.players.find(p => p.id === action.playerId);
        const card = player?.reservedCards?.find(c => c.id === action.cardId);
        if (card) {
          // Mark the slot as animating (will show as empty)
          if (slotInfo) {
            triggerSlotAnimationStart(slotInfo.tier, slotInfo.slotIndex, action.cardId);
          }
          
          triggerCardAnimation(action.cardId, action.playerId, 'reserve', {
            bonus: card.bonus,
            tier: card.tier,
            prestigePoints: card.prestigePoints,
            cost: card.cost,
          });
          
          // After flying card animation completes, trigger deck-to-slot animation
          // Only animate if there are cards left in the deck
          if (slotInfo) {
            const deckCount = slotInfo.tier === 1 ? updatedState.deckCounts.tier1
                            : slotInfo.tier === 2 ? updatedState.deckCounts.tier2
                            : updatedState.deckCounts.tier3;
            if (deckCount > 0) {
              setTimeout(() => {
                // Find the new card that's now in this slot from the updated state
                const marketTier = slotInfo.tier === 1 ? updatedState.market.tier1 
                                 : slotInfo.tier === 2 ? updatedState.market.tier2 
                                 : updatedState.market.tier3;
                const newCard = marketTier[slotInfo.slotIndex] || null;
                triggerDeckToSlotAnimation(slotInfo.tier, slotInfo.slotIndex, newCard);
              }, 2000); // Wait for flying card animation to complete
            } else {
              // No cards in deck, just clear the animating slot after the flying card animation
              setTimeout(() => {
                triggerDeckToSlotAnimation(slotInfo.tier, slotInfo.slotIndex, null);
              }, 2000);
            }
          }
        }
      }
    });
    
    const unsubError = socketClient.onError((error) => {
      dispatch({ type: 'SET_ERROR', error: error.message });
    });
    
    // Initial loading complete - go to menu
    dispatch({ type: 'SET_LOADING', isLoading: false });
    dispatch({ type: 'SET_SCREEN', screen: 'menu' });
    
    // Set a mock user for local development
    dispatch({ 
      type: 'SET_USER', 
      user: {
        id: `user_${Date.now()}`,
        username: 'Player',
        discriminator: '0000',
        avatar: null,
        globalName: 'Player',
      }
    });
    
    return () => {
      unsubRoom();
      unsubPlayerJoined();
      unsubPlayerLeft();
      unsubGameState();
      unsubGameStarted();
      unsubGameEnded();
      unsubActionApplied();
      unsubError();
      socketClient.disconnect();
    };
  }, []);

  // Navigation
  const setScreen = useCallback((screen: AppScreen) => {
    dispatch({ type: 'SET_SCREEN', screen });
  }, []);

  // User actions
  const setLocalPlayerName = useCallback((name: string) => {
    dispatch({ type: 'UPDATE_USER_NAME', name });
  }, []);

  // Room actions
  const createRoom = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      dispatch({ type: 'SET_ERROR', error: null });
      
      const playerName = state.user?.globalName || state.user?.username || 'Player';
      const { room, playerId } = await socketClient.createRoom(playerName);
      
      // Update user ID to match server-assigned playerId
      dispatch({ type: 'UPDATE_USER_ID', id: playerId });
      dispatch({ type: 'SET_ROOM', room });
      dispatch({ type: 'SET_HOST', isHost: true });
      dispatch({ type: 'SET_SCREEN', screen: 'lobby' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [state.user]);

  const joinRoom = useCallback(async (roomId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      dispatch({ type: 'SET_ERROR', error: null });
      
      const playerName = state.user?.globalName || state.user?.username || 'Player';
      const { room, playerId } = await socketClient.joinRoom(roomId, playerName);
      
      // Update user ID to match server-assigned playerId
      dispatch({ type: 'UPDATE_USER_ID', id: playerId });
      dispatch({ type: 'SET_ROOM', room });
      dispatch({ type: 'SET_SCREEN', screen: 'lobby' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [state.user]);

  const leaveRoom = useCallback(async () => {
    try {
      await socketClient.leaveRoom();
      dispatch({ type: 'SET_ROOM', room: null });
      dispatch({ type: 'SET_GAME_STATE', gameState: null as any });
      dispatch({ type: 'SET_SCREEN', screen: 'menu' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    }
  }, []);

  const startGame = useCallback(async (playerCount: 2 | 3 | 4) => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      await socketClient.startGame(playerCount);
      // Game state will be set via onGameStarted subscription
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, []);

  const updatePlayerName = useCallback(async (name: string) => {
    try {
      await socketClient.updatePlayerName(name);
      dispatch({ type: 'UPDATE_USER_NAME', name });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    }
  }, []);

  // Game actions
  const takeThreeGems = useCallback(async (gems: GemColor[]) => {
    try {
      console.log('takeThreeGems called with:', gems, 'playerId:', state.user?.id);
      const action: PlayerAction = {
        type: 'TAKE_THREE_GEMS',
        playerId: state.user!.id,
        gems,
      };
      console.log('Sending action:', action);
      await socketClient.sendAction(action);
      console.log('Action sent successfully');
      dispatch({ type: 'CLEAR_SELECTION' });
    } catch (error) {
      console.error('takeThreeGems error:', error);
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    }
  }, [state.user]);

  const takeTwoGems = useCallback(async (gem: GemColor) => {
    try {
      const action: PlayerAction = {
        type: 'TAKE_TWO_GEMS',
        playerId: state.user!.id,
        gem,
      };
      await socketClient.sendAction(action);
      dispatch({ type: 'CLEAR_SELECTION' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    }
  }, [state.user]);

  const reserveCard = useCallback(async (cardId: string | null, tier: CardTier) => {
    try {
      // Store card position BEFORE sending action (card will be removed from board after action)
      if (cardId) {
        storeCardPositionForAnimation(cardId);
      }
      
      const action: PlayerAction = {
        type: 'RESERVE_CARD',
        playerId: state.user!.id,
        cardId,
        tier,
      };
      await socketClient.sendAction(action);
      dispatch({ type: 'CLEAR_SELECTION' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    }
  }, [state.user]);

  const purchaseCard = useCallback(async (cardId: string) => {
    try {
      // Store card position BEFORE sending action (card will be removed from board after action)
      storeCardPositionForAnimation(cardId);
      
      const action: PlayerAction = {
        type: 'PURCHASE_CARD',
        playerId: state.user!.id,
        cardId,
      };
      await socketClient.sendAction(action);
      dispatch({ type: 'CLEAR_SELECTION' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    }
  }, [state.user]);

  const selectNoble = useCallback(async (nobleId: string) => {
    try {
      const action: PlayerAction = {
        type: 'SELECT_NOBLE',
        playerId: state.user!.id,
        nobleId,
      };
      await socketClient.sendAction(action);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    }
  }, [state.user]);

  const discardGems = useCallback(async (gems: Partial<Record<GemColor | 'gold', number>>) => {
    try {
      const action: PlayerAction = {
        type: 'DISCARD_GEMS',
        playerId: state.user!.id,
        gems,
      };
      await socketClient.sendAction(action);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    }
  }, [state.user]);

  // UI actions
  const selectGem = useCallback((gem: GemColor) => {
    dispatch({ type: 'ADD_SELECTED_GEM', gem });
  }, []);

  const deselectGem = useCallback((gem: GemColor) => {
    dispatch({ type: 'REMOVE_SELECTED_GEM', gem });
  }, []);

  const selectCard = useCallback((cardId: string, forPurchase: boolean) => {
    if (forPurchase) {
      dispatch({ type: 'SET_SELECTED_ACTION', action: { type: 'purchase_card', cardId } });
    } else {
      // For reserve, we need to know the tier - this will be set by the component
      dispatch({ type: 'SET_SELECTED_ACTION', action: { type: 'reserve_card', cardId, tier: 1 } });
    }
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const isMyTurn = useCallback(() => {
    if (!state.gameState || !state.user) return false;
    const currentPlayer = state.gameState.players[state.gameState.currentPlayerIndex];
    return currentPlayer?.id === state.user.id;
  }, [state.gameState, state.user]);

  const getMyPlayer = useCallback(() => {
    if (!state.gameState || !state.user) return null;
    return state.gameState.players.find(p => p.id === state.user!.id) || null;
  }, [state.gameState, state.user]);

  const selectGemForDiscard = useCallback((gem: GemColor | 'gold') => {
    dispatch({ type: 'ADD_GEM_TO_DISCARD', gem });
  }, []);

  const deselectGemFromDiscard = useCallback((gem: GemColor | 'gold') => {
    dispatch({ type: 'REMOVE_GEM_FROM_DISCARD', gem });
  }, []);

  const mustDiscardGems = useCallback(() => {
    return state.gameState?.availableActions?.mustDiscardGems === true;
  }, [state.gameState]);

  const gemsToDiscard = useCallback(() => {
    return state.gameState?.availableActions?.gemsToDiscard ?? 0;
  }, [state.gameState]);

  const value: GameContextValue = {
    state,
    setScreen,
    setLocalPlayerName,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    updatePlayerName,
    takeThreeGems,
    takeTwoGems,
    reserveCard,
    purchaseCard,
    selectNoble,
    discardGems,
    selectGem,
    deselectGem,
    selectGemForDiscard,
    deselectGemFromDiscard,
    selectCard,
    clearSelection,
    isMyTurn,
    getMyPlayer,
    mustDiscardGems,
    gemsToDiscard,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: GameContextState = {
  screen: 'loading',
  isLoading: true,
  error: null,
  user: null,
  isHost: false,
  room: null,
  gameState: null,
  selectedAction: { type: 'none' },
};
