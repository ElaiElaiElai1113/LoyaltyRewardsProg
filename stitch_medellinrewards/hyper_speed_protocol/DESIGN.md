---
name: Hyper-Speed Protocol
colors:
  surface: '#13131b'
  surface-dim: '#13131b'
  surface-bright: '#393842'
  surface-container-lowest: '#0d0d16'
  surface-container-low: '#1b1b23'
  surface-container: '#1f1f27'
  surface-container-high: '#292932'
  surface-container-highest: '#34343d'
  on-surface: '#e4e1ed'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e4e1ed'
  inverse-on-surface: '#302f39'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#ffecc0'
  on-secondary: '#3d2f00'
  secondary-container: '#fecb00'
  on-secondary-container: '#6e5700'
  tertiary: '#fff5ff'
  on-tertiary: '#4b007e'
  tertiary-container: '#edd1ff'
  on-tertiary-container: '#8e00e8'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#ffe08b'
  secondary-fixed-dim: '#f1c100'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#f1daff'
  tertiary-fixed-dim: '#dfb7ff'
  on-tertiary-fixed: '#2d004f'
  on-tertiary-fixed-variant: '#6b00b0'
  background: '#13131b'
  on-background: '#e4e1ed'
  surface-variant: '#34343d'
typography:
  display-xp:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 40px
  container-max: 1440px
---

## Brand & Style

The design system is engineered to evoke the high-stakes atmosphere of a premium RPG dashboard. It moves away from standard corporate aesthetics in favor of an immersive, high-octane environment that rewards user progression. The brand personality is prestigious, technical, and energetic, treating every loyalty interaction as a "level up" event.

The visual style is a hybrid of **Glassmorphism** and **Retro-Futurism**. It utilizes deep layered depth, semi-transparent surfaces, and light-emitting elements to simulate a high-tech HUD (Heads-Up Display). The aesthetic avoids playful or casual tropes, leaning instead into a "pro-gamer" or "commander" interface that feels both powerful and precise.

## Colors

The palette is anchored by a deep navy-black foundation, providing maximum contrast for the radiant neon accents. 

- **Primary (Electric Blue):** Used for interactive elements, primary actions, and active states.
- **Secondary (Gold):** Reserved for high-value rewards, achievement milestones, and premium currency.
- **Rarity Tiering:** A distinct four-tier color system is utilized for items, badges, and rewards to provide immediate visual feedback on the value of earned assets.
- **Functional Accents:** Violet is used for special "Epic" events, while the deep navy background maintains visual stability.

All vibrant colors should be treated as light sources, often accompanied by soft glows (outer glows) to simulate a holographic projection on the dark base.

## Typography

This design system utilizes a dual-font strategy to balance character with readability. 

**Space Grotesk** is the voice of the system. Its technical, geometric construction is used for all "high-data" moments: XP counters, level headers, and navigational labels. It should be used in uppercase for labels to reinforce the military-grade HUD aesthetic.

**Inter** serves as the functional workhorse. It is used for all long-form body text, descriptions, and tooltips where clarity and legibility are paramount. By pairing a technical display face with a clean sans-serif, the interface remains readable during high-intensity interactions.

## Layout & Spacing

The layout follows a **Fixed Grid** model to ensure the dashboard feels like a self-contained command center. A 12-column grid is used for the primary content area, with generous 24px gutters to allow the "glow" of individual panels space to breathe.

Layouts are organized into distinct "Zones":
1. **The Navigation Rail:** A slim, vertical sidebar for top-level navigation.
2. **The Status Header:** A persistent top bar displaying user rank, XP, and currency.
3. **The Core Module:** Centrally located panels for the primary task or game view.

Spacing is strictly mathematical, built on a 4px baseline to ensure technical precision in the alignment of glassy borders and metallic accents.

## Elevation & Depth

Depth in this design system is created through **Glassmorphism** and light physics rather than traditional shadows.

- **Surface Layers:** All panels use a semi-transparent background (`rgba(10, 10, 18, 0.7)`) with a high-intensity `backdrop-filter: blur(20px)`.
- **Holographic Borders:** Instead of shadows, elevation is indicated by a 1px inner stroke. Higher-level elements feature a subtle "top-light" gradient on the border to simulate a metallic edge catching a light source.
- **The Grid Floor:** A subtle, low-opacity vector grid is placed at the lowest Z-index to provide a sense of scale and ground the floating panels.
- **Neon Underglow:** Active elements or "Legendary" items emit a soft, diffused outer glow in their respective rarity or primary color.

## Shapes

The shape language is "Technical-Soft." A base roundedness of `0.25rem` (4px) is applied to most UI components to maintain a modern, machined feel without the aggression of 90-degree corners. 

For larger containers or "Hero" cards, the `rounded-lg` (8px) setting is used. The design avoids pill-shapes and circles (except for progress rings), as the rectangularity reinforces the grid-based, futuristic HUD theme. Corner treatments on panels can occasionally feature a 45-degree "chamfered" look through CSS clip-paths to further the RPG aesthetic.

## Components

### Buttons
Primary buttons feature a solid Electric Blue fill with a subtle "scanning" animation (a lighter blue line moving across the surface). Secondary buttons are "Ghost" style with a 1px border and a low-opacity fill that intensifies on hover.

### Progress Bars (XP Bars)
These are segmented rather than continuous, appearing as a series of small vertical blocks that fill up. They should feature a "shimmer" effect when progress is added.

### Rarity Cards
Cards utilize a specific border-color corresponding to the item's rarity. The background remains dark navy, but the "glow" and the top-right label adapt to the rarity color (e.g., Orange for Legendary).

### Input Fields
Inputs are dark with a 1px bottom-border only. When focused, the border expands into a full frame with a cyan glow, and the label transforms into a small uppercase tag above the field.

### Holographic Chips
Small, non-interactive badges used for tags. They feature a high-blur background and a vibrant border, appearing to float slightly above the panel surface.

### Additional Components
- **Level-Up Modal:** A full-screen overlay with a central gold-tinted glass panel and particle effects.
- **Hexagonal Hex-Grid Menu:** For special talent trees or reward paths, using 6-sided shapes to break the rectangular monotony.