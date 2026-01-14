# Splendor — Game Rules Specification

## 1. Game Overview

Splendor is a turn-based, multiplayer resource-management game for 2–4 players.
Players collect gem tokens, purchase development cards, attract nobles, and score prestige points.
The game ends when a player reaches 15 or more prestige points, after the round completes.

## 2. Core Entities

### 2.1 Player

#### Player State

Each player has:

- **id** — unique identifier
- **gems** — count of held gem tokens
- **bonuses** — permanent gem discounts from purchased cards
- **reservedCards** — up to 3 reserved development cards
- **purchasedCards** — all acquired development cards
- **nobles** — nobles acquired
- **prestigePoints** — total score

#### Gem Limits

- A player may hold at most **10 gem tokens**.
- Excess gems must be discarded immediately after an action that exceeds the limit.

### 2.2 Gem Pool (Token Supply)

#### Gem Types

- Emerald (green)
- Diamond (white)
- Sapphire (blue)
- Onyx (black)
- Ruby (red)
- Gold (wild / joker)

#### Initial Token Counts

| Players | Each Colored Gem | Gold |
|---------|------------------|------|
| 2       | 4                | 5    |
| 3       | 5                | 5    |
| 4       | 7                | 5    |

### 2.3 Development Cards

#### Card Structure

Each development card has:

- **tier** — I, II, or III
- **cost** — required gems to purchase
- **bonus** — permanent gem discount (one color)
- **prestigePoints** — 0–5

#### Market Layout

- Each tier has a deck.
- 4 face-up cards per tier are available at all times (if deck allows).
- When a card is removed, immediately replace it from the same tier deck.

### 2.4 Nobles

#### Noble Structure

Each noble has:

- **requirements** — minimum permanent bonuses needed
- **prestigePoints** — always 3

#### Noble Rules

- Nobles cannot be purchased.
- A player receives at most one noble per turn.
- If multiple nobles are eligible, the player chooses.

### 2.5 Bank

The bank holds:

- All unclaimed gem tokens
- All undealt development cards
- All nobles not yet claimed

The bank validates all token availability and card replacements.

### 2.6 Turn Order

- Players are ordered randomly at game start.
- Turns proceed clockwise.
- Each turn consists of exactly one main action, followed by:
  - Noble check
  - Gem limit enforcement
- Game end is checked after each full round.

## 3. Player Actions

Only one of the following actions may be taken per turn.

### 3.1 Take 3 Different Gems

#### Rules

- Take exactly 3 gems of different colors
- Colors must be among the 5 non-gold gem types
- Each chosen gem must be available in the bank

#### Constraints

- Gold gems cannot be taken via this action
- Action invalid if fewer than 3 distinct colors are available

### 3.2 Take 2 Same Gems

#### Rules

- Take 2 gems of the same color

#### Constraints

- The bank must have at least 4 gems of that color before the action
- Gold gems cannot be taken this way

### 3.3 Reserve a Card

#### Rules

Reserve one development card:

- Either face-up from the market
- Or top card from a tier deck (blind)
- Receive 1 gold gem, if available

#### Constraints

- Player may hold maximum 3 reserved cards
- If no gold gems remain, reservation is still allowed (without gold)

### 3.4 Purchase a Card

#### Rules

Purchase a card from:

- The market
- The player's reserved cards

Cost is reduced by player's permanent bonuses.
Gold gems may substitute for any missing color.

#### Effects

- Remove gems from player → return to bank
- Add card to purchasedCards
- Apply card bonus permanently
- Add prestige points

### 3.5 Receive a Noble (Automatic)

#### Rules

At the end of the player's turn:

- If player meets requirements for one or more nobles
- Player chooses one noble
- Noble is removed from the game and added to the player

## 4. Validation Rules (Critical)

An action is invalid if:

- It violates token availability
- It exceeds gem limits without resolving discards
- It attempts to bypass cost requirements
- It targets unavailable cards or nobles

All validation must occur before state mutation.

## 5. Gem Discard Rule

If a player exceeds 10 total gems after their action:

- Player must immediately discard gems of their choice
- Discarded gems return to the bank
- No further game progress until resolved

## 6. Win Condition

### Trigger

When a player reaches **15 or more prestige points**.

### Resolution

The current round continues until all players have taken the same number of turns.

The winner is determined by:

1. Highest prestige points wins
2. If tied: fewest purchased cards
3. If still tied: shared victory

## 7. Game Initialization

1. Shuffle development decks by tier
2. Reveal 4 cards per tier
3. Randomize turn order
4. Deal nobles based on player count: **Players + 1** nobles
