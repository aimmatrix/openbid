---
name: OpenBid Command System
colors:
  surface: '#131318'
  surface-dim: '#131318'
  surface-bright: '#39393e'
  surface-container-lowest: '#0e0e12'
  surface-container-low: '#1b1b20'
  surface-container: '#1f1f24'
  surface-container-high: '#2a292f'
  surface-container-highest: '#343439'
  on-surface: '#e4e1e8'
  on-surface-variant: '#bbc9cd'
  inverse-surface: '#e4e1e8'
  inverse-on-surface: '#303035'
  outline: '#859397'
  outline-variant: '#3c494c'
  surface-tint: '#2fd9f4'
  primary: '#8aebff'
  on-primary: '#00363e'
  primary-container: '#22d3ee'
  on-primary-container: '#005763'
  inverse-primary: '#006877'
  secondary: '#4ae176'
  on-secondary: '#003915'
  secondary-container: '#00b954'
  on-secondary-container: '#004119'
  tertiary: '#ffd6a3'
  on-tertiary: '#462b00'
  tertiary-container: '#ffb13b'
  on-tertiary-container: '#6e4600'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a2eeff'
  primary-fixed-dim: '#2fd9f4'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb957'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#131318'
  on-background: '#e4e1e8'
  surface-variant: '#343439'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.2'
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.2'
  label-xs:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 12px
  margin-mobile: 16px
  margin-desktop: 24px
---

## Brand & Style

The design system is engineered for high-stakes, autonomous media buying, evoking the precision of a modern financial trading terminal or a mission control center. The aesthetic is rooted in **Modern Minimalist-Industrialism**, prioritizing high information density and rapid cognitive processing.

The UI should feel like a sophisticated instrument—utilitarian, reliable, and hyper-focused. By utilizing a dark, low-contrast foundation punctuated by vibrant functional accents, the design system ensures that critical data "pops" while secondary controls recede. Visual noise is aggressively eliminated to support long-duration monitoring and complex decision-making.

## Colors

The palette is strictly functional, utilizing a "Lights-Out" architecture. 

- **Foundation:** The canvas uses a near-black (#0a0a0b) to minimize eye strain, with elevated surfaces using a subtle shift to #141417. 
- **Accents:** Cyan is the primary action and detection color. Green is reserved strictly for financial growth and successful bid executions. Amber and Red serve as critical interruptors for system warnings or blocked traffic.
- **Borders:** A consistent 1px border (#26262b) is the primary method for defining hierarchy and containment, replacing the need for traditional shadows.

## Typography

This design system employs a dual-font strategy to separate UI controls from raw data.

- **UI & Navigation:** Uses **Geist** for its neutral, technical geometric construction. It provides excellent legibility at small sizes while maintaining a modern, architectural feel in headlines.
- **Data & Metrics:** Uses **JetBrains Mono** for all numerical values, bid amounts, audit logs, and status readouts. The monospaced nature ensures that columns of changing numbers remain vertically aligned, preventing "jumping" during real-time updates.

Typography sizes are intentionally smaller than consumer-facing apps to facilitate high information density.

## Layout & Spacing

The layout follows a **Fixed Grid** model for the primary workspace to ensure that data visualizations and tables remain predictable for the user. 

- **Grid:** A 12-column grid with tight 12px gutters is used to maximize screen real estate.
- **Density:** Spacing is built on a 4px base unit. Component internal padding should lean toward the `sm` (8px) and `md` (16px) values to keep the UI compact.
- **Adaptation:** On mobile, the system collapses to a single-column scroll, but for tablet and desktop, sidebars should remain docked to preserve the "Command Center" feel.

## Elevation & Depth

This system rejects the use of traditional soft shadows in favor of **Tonal Layering and 1px Outlines**.

- **Level 0 (Base):** #0a0a0b for the main background.
- **Level 1 (Panels):** #141417 with a 1px border (#26262b). 
- **Level 2 (Popovers/Tooltips):** #1c1c1f with a slightly brighter 1px border (#3f3f46).

**Glow Effects:** To signify active status or critical updates, a subtle outer glow (0px 0px 8px) using the accent color (Cyan or Green) at 30% opacity may be applied to small UI indicators or the primary revenue counter. Surfaces themselves remain flat and matte.

## Shapes

The design system utilizes **Rounded (Level 2)** shapes to soften the technical edge of the interface without making it feel "bubbly."

- **Standard Elements:** 8px (0.5rem) radius for buttons, input fields, and cards.
- **Large Containers:** 16px (1rem) for primary dashboard widgets.
- **Status Tags:** 4px (0.25rem) or fully pill-shaped for small indicators.

This balance ensures the UI feels modern and professional, avoiding the harshness of sharp 0px corners while maintaining the structural integrity of a terminal.

## Components

- **Buttons:** Primary buttons use a solid Cyan (#22d3ee) fill with black text. Secondary buttons use a ghost style: 1px border (#26262b) with Cyan text. No gradients.
- **Input Fields:** Dark background (#0a0a0b), 1px border (#26262b). On focus, the border transitions to Cyan. Use JetBrains Mono for input text.
- **Cards/Panels:** These are the backbone of the "mission control" look. Use #141417 backgrounds with a subtle header area separated by a 1px horizontal line.
- **Data Tables:** Highly condensed. Row height should be 32px or 40px maximum. Use alternating row zebra-striping only if necessary; preferably use 1px horizontal dividers.
- **Chips/Status:** Small, uppercase labels using JetBrains Mono. Success chips should have a Green border and 10% Green background tint.
- **Revenue Counter:** The most prominent element. Large JetBrains Mono text with a subtle Green glow to indicate active income generation.
- **Bidding Logs:** A scrolling feed of monospaced text. Use subtle color coding (Cyan for 'bid placed', Green for 'won') for the text itself rather than background blocks.