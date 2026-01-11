
# Splendor Discord Activity – UX Mock Design

This document describes a **minimalist UX mockup** for a Splendor-style board game designed for a Discord Activity.  
The mockup prioritizes clarity, spatial consistency, and multiplayer readability over visual detail.

---

## Design Principles

- Flat, minimal shapes only
- Color + shape communicate meaning
- No textures, art, or animation assumptions
- Scales cleanly to Discord embedded size
- Symmetrical layout across player counts

---

## Global Board Layout

The shared board is centered and divided horizontally into four zones:

```
| Tier Decks | Market Cards | Gem Bank | Nobles |
```

Each zone is visually separated using spacing rather than borders.

---

## Tier Deck Stacks

- Located at the start of each market row (leftmost position)
- Same size as market cards (100x140px)
- Face-down rectangular cards
- Roman numeral tier label on each stack (I, II, III)
- Numeric counter indicating remaining cards
- Visually aligned with their respective tier row

Interaction:
- Clickable only when reserving (highlighted border when available)
- No card details revealed

---

## Market Cards (Center)

### Layout
- 3 rows (Tier III → Tier I)
- 4 cards per row
- Uniform rectangular cards

### Card Contents
- Top-left: Prestige value
- Top-right: Bonus color indicator
- Bottom row: Cost represented by colored dots + numbers

### Interaction
- Hover highlight
- Click to purchase or reserve
- Disabled state when unaffordable

---

## Gem Bank (Right-Center)

### Layout
Vertical alignment by gem color:

- Emerald (green)
- Ruby (red)
- Diamond (white)
- Sapphire (blue)
- Onyx (black)
- Gold (yellow)

### Design
- Circular tokens
- Numeric count overlay
- Gold visually distinct

Interaction:
- Click to select gems
- Visual accumulation for multi-gem selection

---

## Nobles Area (Far Right)

- Each noble shows:
  - Prestige value
  - Requirement icons

Rules:
- Non-clickable
- Highlighted when eligible
- Selection modal appears if multiple are eligible

---

## Player Areas

The screen is divided into three main regions:
- **Left sidebar**: All opponent player panels stacked vertically
- **Center**: The game board
- **Bottom**: Local player's panel

### Components
- Player name + turn indicator
- Owned cards (grouped by color)
- Owned gems (aligned under cards)
- Owned nobles (right-aligned)

---

## Owned Cards Layout

- Cards grouped by bonus color
- Each color forms a vertical stack
- Cards use the same visual style as reserved cards:
  - Top-left: Prestige value (if any)
  - Top-right: Bonus color indicator
  - Bottom: Cost displayed as colored pips
- Stacked cards have vertical offset (~25px visible) revealing:
  - Card color/bonus indicator
  - Prestige value

---

## Owned Gems Layout

- Gems appear directly under the matching card color stack
- Represented as small colored circles with counts
- Gold gems appear in a separate column or bottom row

---

## Owned Nobles Layout

- Positioned to the right of cards
- Prestige value visible

---

## Orientation by Player Count

All player counts use the same layout:
- Local player's panel is displayed at the bottom of the screen
- All opponents are stacked vertically in a left sidebar
- No rotation is applied to any player panel
- Opponent panels use a compact style to fit multiple players

This consistent layout ensures readability and simplifies the UI regardless of 2, 3, or 4 player games.

---

## Visual Priority Order

1. Active player indicator
2. Card bonuses and prestige
3. Gem counts
4. Noble eligibility
5. Decorative elements (minimal)

No textures, gradients, or illustrations assumed.
