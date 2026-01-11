# Splendubious Changeset

This file tracks all changes made to the Splendubious Discord Activity project.

---

## [2026-01-10] Frontend Implementation

### Overview
Fully implemented the frontend React application with all game components, screens, and socket integration.

### Files Implemented

| File | Description |
|------|-------------|
| `packages/frontend/src/socket/client.ts` | Full Socket.IO client implementation with event subscriptions |
| `packages/frontend/src/context/GameContext.tsx` | React context with reducer, socket integration, all game actions |
| `packages/frontend/src/components/game/GemToken.tsx` | Gem token display with size variants and selection states |
| `packages/frontend/src/components/game/DevelopmentCard.tsx` | Card display with prestige, bonus, costs; includes DeckCard component |
| `packages/frontend/src/components/game/NobleTile.tsx` | Noble tile with prestige and requirements |
| `packages/frontend/src/components/game/GameBoard.tsx` | Main board layout: tier decks, market, gem bank, nobles |
| `packages/frontend/src/components/game/ActionPanel.tsx` | Action selection UI with confirm/cancel, selection preview |
| `packages/frontend/src/components/game/PlayerPanel.tsx` | Player state: gems, bonuses, cards, reserved, nobles |
| `packages/frontend/src/components/screens/LoadingScreen.tsx` | Loading spinner with error handling |
| `packages/frontend/src/components/screens/MenuScreen.tsx` | Create/join game interface |
| `packages/frontend/src/components/screens/LobbyScreen.tsx` | Room code, player list, game settings |
| `packages/frontend/src/components/screens/GameScreen.tsx` | Full game layout with player positioning |
| `packages/frontend/src/styles/index.css` | Complete CSS with game board, player panels, cards, gems |

### Key Features Implemented

**Socket Client:**
- `connect()` with reconnection config
- `createRoom()`, `joinRoom()`, `leaveRoom()`, `startGame()`, `sendAction()`
- Event subscriptions: `onRoomUpdated`, `onGameStateUpdated`, `onGameStarted`, `onGameEnded`, `onError`

**Game Context:**
- Full reducer with gem selection (ADD/REMOVE_SELECTED_GEM)
- Socket integration via useEffect
- Game actions: `takeThreeGems`, `takeTwoGems`, `reserveCard`, `purchaseCard`, `selectNoble`, `discardGems`
- Helper functions: `isMyTurn()`, `getMyPlayer()`

**Game Board Layout (per UX.md):**
- Horizontal layout: `| Tier Decks | Market Cards | Gem Bank | Nobles |`
- 3 tier rows (Tier 3 → Tier 1)
- Interactive gem selection with availability checking
- Card purchase/reserve highlighting

**Player Panel:**
- Position-based layout (top/bottom/left/right)
- Gem and bonus display
- Card stacks grouped by bonus color
- Reserved cards (local player only)
- Noble tiles earned

**Action Panel:**
- Selection status display
- Gem preview with remove buttons
- Confirm/cancel buttons with validation
- Gem count indicator (approaching/at limit)

**Screen Components:**
- Loading: Animated gem spinner, error retry
- Menu: Create game, join with room code
- Lobby: Room code display, player list, settings (host only)
- Game: Dynamic player positioning by count, game end overlay

### CSS Styling
- CSS variables for gem colors, UI colors, spacing
- Responsive game board layout
- Player panel positions with rotation for side players
- Card and gem token hover/selection states
- Action panel with status indicators

---

## [2026-01-10] Rules Engine & Backend Implementation

### Overview
Fully implemented the rules-engine and backend packages with comprehensive test coverage.

### Rules Engine Implementation

**177 total tests passing** (111 rules-engine + 66 backend)

#### Files Implemented

| File | Description | Tests |
|------|-------------|-------|
| `packages/rules-engine/src/data/cards.ts` | Complete card data (40 Tier 1, 30 Tier 2, 20 Tier 3 cards) + 10 nobles | - |
| `packages/rules-engine/src/initialization.ts` | `createGame()`, `initializeBank()`, `shuffleDeck()`, `dealMarket()`, `selectNobles()` | 26 |
| `packages/rules-engine/src/validators.ts` | All action validators with helpers for turn checking, cost calculation, affordability | 35 |
| `packages/rules-engine/src/actions.ts` | All action handlers, turn management, game end detection, winner determination | 27 |
| `packages/rules-engine/src/availability.ts` | Available action calculation for UI hints | 23 |
| `packages/rules-engine/src/types.ts` | Added `pendingGemDiscard`, `pendingNobleSelection` fields to GameState | - |

#### Key Functions Implemented

**Validators:**
- `validateAction()` - Main dispatcher
- `validateTakeThreeGems()` - 3 different gems validation
- `validateTakeTwoGems()` - 2 same gems (requires 4+ in bank)
- `validateReserveCard()` - Max 3 reserved cards
- `validatePurchaseCard()` - Cost calculation with bonuses and gold
- `validateSelectNoble()` - Noble eligibility
- `validateDiscardGems()` - Discard to exactly 10 gems
- Helper functions: `isPlayersTurn()`, `calculateEffectiveCost()`, `canAffordCard()`, `getEligibleNobles()`

**Actions:**
- `applyAction()` - Main dispatcher
- `applyTakeThreeGems()`, `applyTakeTwoGems()`, `applyReserveCard()`, `applyPurchaseCard()`
- `applySelectNoble()`, `applyDiscardGems()`
- `advanceTurn()`, `checkGameEndTrigger()`, `checkGameEnd()`, `determineWinners()`
- `calculatePayment()` - Optimal gem payment with gold as wildcard

**Availability:**
- `getAvailableActions()` - Full action availability for current player
- `getTakeGemOptions()` - Available gem combinations
- `getReservableCards()` - Cards available for reservation
- `getPurchasableCards()` - Affordable cards with shortfall info

### Backend Implementation

#### Files Implemented

| File | Description | Tests |
|------|-------------|-------|
| `packages/backend/src/rooms/roomManager.ts` | Room CRUD, player management, status updates, cleanup | 32 |
| `packages/backend/src/game/gameController.ts` | Game start, action processing, state projection | 34 |
| `packages/backend/src/socket/handlers.ts` | Socket.IO event handlers for rooms and game actions | - |

#### Key Functions Implemented

**Room Manager:**
- `createRoom()` - Generate 4-letter room codes
- `joinRoom()` - Player/spectator joining with reconnection support
- `leaveRoom()` - Host reassignment, room cleanup
- `updatePlayerStatus()` - Connection status tracking
- `cleanupInactiveRooms()` - Automatic cleanup after 1 hour

**Game Controller:**
- `startGame()` - Initialize game with rules engine
- `processAction()` - Validate and apply actions
- `endGame()` - Forfeit/timeout handling
- `toClientGameState()` - State projection hiding opponent secrets
- `toClientPlayerState()` - Per-player state with hidden reserved cards
- `isPlayerTurn()`, `getCurrentPlayerId()`, `getGameState()`

**Socket Handlers:**
- `room:create`, `room:join`, `room:leave`, `room:start`
- `game:action` - Process player actions
- Disconnect handling with status updates
- `broadcastGameState()` - Personalized state to each player

### Bug Fixes
1. Fixed `applyPurchaseCard` - Payment calculation now happens before card removal from market
2. Fixed game end test - Player gem counts must stay under limit to avoid pending discard state

---

## [2026-01-10] Local Development Mode - Discord SDK Bypass

### Overview
Modified frontend to bypass Discord SDK for local browser testing.

### Files Modified

| File | Changes |
|------|---------|
| `packages/frontend/src/context/GameContext.tsx` | Implemented reducer and stub methods for all context actions |
| `packages/frontend/src/App.tsx` | Added temporary `LandingPage` component for local dev |
| `packages/frontend/src/styles/index.css` | Added landing page styles |

### How to Test
```bash
cd packages/frontend
npm run dev
```
Then open http://localhost:5173 in your browser.

---

## [2026-01-10] Initial Project Scaffolding

### Overview
Created a monorepo architecture for a Discord Activity application based on the board game Splendor.
The project consists of three packages: rules-engine, backend, and frontend.

---

### Root Configuration

| File | Description |
|------|-------------|
| `package.json` | Root monorepo configuration with npm workspaces for all three packages |
| `tsconfig.base.json` | Shared TypeScript configuration extended by all packages |
| `.gitignore` | Standard gitignore for Node.js/TypeScript projects |

---

### Package: @splendubious/rules-engine

**Purpose:** Fully deterministic, testable game rules engine

**Responsibilities:**
- ✅ Define all Splendor rules
- ✅ Validate player actions
- ✅ Apply state transitions
- ✅ Determine game end

#### Files Created

| File | Description | Status |
|------|-------------|--------|
| `packages/rules-engine/package.json` | Package configuration with vitest for testing | Complete |
| `packages/rules-engine/tsconfig.json` | TypeScript config extending base | Complete |
| `packages/rules-engine/src/types.ts` | All type definitions (gems, cards, nobles, players, game state, actions, validation) | Complete |
| `packages/rules-engine/src/data/cards.ts` | Game data (90 development cards, 10 nobles) | Complete |
| `packages/rules-engine/src/data/index.ts` | Data module exports | Complete |
| `packages/rules-engine/src/initialization.ts` | Game creation and setup functions | Complete |
| `packages/rules-engine/src/validators.ts` | Action validation logic | Complete |
| `packages/rules-engine/src/actions.ts` | State transition functions | Complete |
| `packages/rules-engine/src/availability.ts` | Available action calculation for UI | Complete |
| `packages/rules-engine/src/index.ts` | Public API exports | Complete |

#### Key Types Defined

- **Gems:** `GemColor`, `GemType`, `GemCollection`, `ColoredGemCollection`
- **Cards:** `DevelopmentCard`, `CardTier`, `CardMarket`, `CardDecks`
- **Nobles:** `Noble`
- **Players:** `Player`
- **Game State:** `GameState`, `GamePhase`
- **Actions:** `TakeThreeGemsAction`, `TakeTwoGemsAction`, `ReserveCardAction`, `PurchaseCardAction`, `SelectNobleAction`, `DiscardGemsAction`
- **Validation:** `ValidationResult`, `ValidationErrorCode`
- **Config:** `GameConfig`, `INITIAL_GEM_COUNTS`, `GAME_CONSTANTS`

---

### Package: @splendubious/backend

**Purpose:** Game server managing rooms and authoritative state

**Responsibilities:**
- ✅ Own game rooms
- ✅ Maintain authoritative GameState
- ✅ Enforce turn order
- ✅ Validate & apply actions via rules-engine
- ✅ Handle reconnects & spectators
- ✅ Broadcast state updates

#### Files Created

| File | Description | Status |
|------|-------------|--------|
| `packages/backend/package.json` | Package config with Express, Socket.IO dependencies | Complete |
| `packages/backend/tsconfig.json` | TypeScript configuration | Complete |
| `packages/backend/src/types.ts` | Server types (rooms, socket events, DTOs) | Complete |
| `packages/backend/src/rooms/roomManager.ts` | Room lifecycle management | Complete |
| `packages/backend/src/rooms/index.ts` | Room module exports | Complete |
| `packages/backend/src/game/gameController.ts` | Game logic and state projection | Complete |
| `packages/backend/src/game/index.ts` | Game module exports | Complete |
| `packages/backend/src/socket/handlers.ts` | WebSocket event handlers | Complete |
| `packages/backend/src/socket/index.ts` | Socket module exports | Complete |
| `packages/backend/src/index.ts` | Server entry point with Express/Socket.IO setup | Complete |

#### Key Types Defined

- **Rooms:** `GameRoom`, `RoomPlayer`, `RoomStatus`, `ConnectionStatus`
- **Socket Events:** `ClientToServerEvents`, `ServerToClientEvents`
- **DTOs:** `RoomStateDTO`, `PlayerDTO`, `ClientGameState`, `ClientPlayerState`

---

### Package: @splendubious/frontend

**Purpose:** React-based Discord Activity UI

**Responsibilities:**
- ✅ Render game state
- ✅ Collect player intent
- ✅ Disable illegal actions (UX only)
- ✅ Communicate via sockets
- ✅ Integrate Discord SDK

#### Files Created

| File | Description | Status |
|------|-------------|--------|
| `packages/frontend/package.json` | Package config with React, Vite, Discord SDK | Complete |
| `packages/frontend/tsconfig.json` | TypeScript configuration for React | Complete |
| `packages/frontend/vite.config.ts` | Vite build configuration with proxy | Complete |
| `packages/frontend/index.html` | HTML entry point | Complete |
| `packages/frontend/src/types.ts` | Frontend type definitions | Complete |
| `packages/frontend/src/discord/sdk.ts` | Discord SDK integration | TODO: Implement functions |
| `packages/frontend/src/discord/index.ts` | Discord module exports | Complete |
| `packages/frontend/src/socket/client.ts` | Socket.IO client wrapper | TODO: Implement functions |
| `packages/frontend/src/socket/index.ts` | Socket module exports | Complete |
| `packages/frontend/src/context/GameContext.tsx` | React context for game state | TODO: Implement context |
| `packages/frontend/src/context/index.ts` | Context module exports | Complete |
| `packages/frontend/src/components/game/GameBoard.tsx` | Main game board component | TODO: Implement UI |
| `packages/frontend/src/components/game/PlayerPanel.tsx` | Player info display | TODO: Implement UI |
| `packages/frontend/src/components/game/ActionPanel.tsx` | Action selection UI | TODO: Implement UI |
| `packages/frontend/src/components/game/DevelopmentCard.tsx` | Card component | TODO: Implement UI |
| `packages/frontend/src/components/game/NobleTile.tsx` | Noble component | TODO: Implement UI |
| `packages/frontend/src/components/game/GemToken.tsx` | Gem token component | TODO: Implement UI |
| `packages/frontend/src/components/game/index.ts` | Game component exports | Complete |
| `packages/frontend/src/components/screens/LoadingScreen.tsx` | Loading state | TODO: Implement UI |
| `packages/frontend/src/components/screens/MenuScreen.tsx` | Main menu | TODO: Implement UI |
| `packages/frontend/src/components/screens/LobbyScreen.tsx` | Pre-game lobby | TODO: Implement UI |
| `packages/frontend/src/components/screens/GameScreen.tsx` | Main game screen | TODO: Implement UI |
| `packages/frontend/src/components/screens/index.ts` | Screen exports | Complete |
| `packages/frontend/src/components/index.ts` | All component exports | Complete |
| `packages/frontend/src/App.tsx` | Root app with screen routing | Complete |
| `packages/frontend/src/main.tsx` | React entry point | Complete |
| `packages/frontend/src/styles/index.css` | Global styles with CSS variables | Complete (base structure) |

---

## Implementation Checklist

### Rules Engine (Priority 1) ✅ COMPLETE
- [x] Populate `TIER_1_CARDS`, `TIER_2_CARDS`, `TIER_3_CARDS` with actual card data
- [x] Populate `NOBLES` with actual noble data
- [x] Implement `createGame()` and initialization functions
- [x] Implement all validators (`validateTakeThreeGems`, etc.)
- [x] Implement all action handlers (`applyTakeThreeGems`, etc.)
- [x] Implement turn management (`advanceTurn`, `checkNobleAcquisition`)
- [x] Implement game end detection (`checkGameEndTrigger`, `determineWinners`)
- [x] Implement availability calculations (`getAvailableActions`, etc.)
- [x] Add comprehensive unit tests (111 tests passing)

### Backend (Priority 2) ✅ COMPLETE
- [x] Implement room management functions
- [x] Implement game controller functions
- [x] Implement socket event handlers
- [x] Implement state projection for clients
- [x] Add reconnection handling
- [x] Add room cleanup for inactive rooms
- [x] Add comprehensive unit tests (66 tests passing)
- [ ] Add Discord OAuth integration endpoint

### Frontend (Priority 3)
- [ ] Implement Discord SDK initialization and auth
- [ ] Implement socket client connection
- [ ] Implement GameContext reducer and actions
- [ ] Build out all game UI components
- [ ] Add animations and transitions
- [ ] Implement responsive design
- [ ] Add sound effects (optional)

---

## Architecture Notes

### Data Flow
```
Discord SDK → Frontend → Socket.IO → Backend → Rules Engine
                                         ↓
                                   GameState
                                         ↓
                                   Backend → Socket.IO → Frontend (broadcast)
```

### State Ownership
- **Frontend:** UI state, selections, animations
- **Backend:** Authoritative GameState, room management
- **Rules Engine:** Pure functions, no state (receives state, returns new state)

### Validation Strategy
- **Frontend:** UX-only validation (disable unavailable actions)
- **Backend:** Authoritative validation via rules engine before state mutation

---

## Next Steps

1. ~~Implement rules engine core logic~~ ✅ Complete
2. ~~Add unit tests for rules engine~~ ✅ Complete (111 tests)
3. ~~Implement backend socket handlers~~ ✅ Complete (66 tests)
4. Build frontend UI components
5. Integrate Discord SDK
6. End-to-end testing
7. Discord Developer Portal setup
