# Design Specification: OpenBid Command Center

This document provides a comprehensive design specification for the OpenBid Command Center dashboard, suitable for implementation with Claude or other frontend development workflows.

## 1. Project Overview
**Brand:** OpenBid  
**Platform:** Autonomous media-buying platform with AI advertiser agents and real-time oversight.  
**Style:** Mission-control console / live financial trading terminal.  
**Tone:** Dark, high-contrast, dense, confident, and dramatic.

## 2. Visual Identity (Design System)
Based on `{{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}}`.

### Colors
- **Surface (Background):** `#0a0a0b` (Near-black)
- **Panel Background:** `#141417`
- **Borders:** `1px` solid `#26262b`
- **Primary Accent (Cyan):** `#22d3ee` (Used for detection slots, scanning lines)
- **Success (Green):** `#22c55e` (Used for revenue, "APPROVED" states)
- **Danger (Red):** `#ef4444` (Used for "BLOCKED" states, Veto button)
- **Warning (Amber):** `#f59e0b` (Used for pending states)
- **Text:** Cool white and Zinc grays

### Typography
- **Headings:** Bold geometric sans-serif (e.g., Geist, Inter, or Montserrat).
- **Data/Monospace:** JetBrains Mono (or similar) for all numbers, bids, timestamps, and audit logs.
- **Weights:** Bold for wordmarks/headers, Medium for primary data, Light/Regular for labels and descriptions.

### Effects
- **Glows:** Subtle outer glows (`box-shadow` or `text-shadow`) on the Revenue counter and high-bidder cards.
- **Roundness:** `8px` (`rounded-lg`) on panels and cards.

## 3. Layout Structure
- **Global:** Single-screen desktop dashboard.
- **Top Bar:** Fixed height (~64px), full width.
- **Body:** Two-column flex/grid container.
    - **Left Column (~60%):** Video Stage.
    - **Right Column (~40%):** Vertical panel stack.
- **Status Strip:** Slim footer fixed to the bottom.

## 4. Component Details

### A. Top Navigation Bar
- **Logo:** "OpenBid" in bold geometric font.
- **Live Indicator:** Small green pill "● LIVE" with a subtle pulse.
- **Segmented Control:** Toggle between "Kitchen — morning" and "Park — afternoon".
- **Platform Revenue:** Monospace counter (e.g., "£14,280.00") with a green glow.
- **Primary Action:** Circular "Run Auction" button (Cyan/Primary background).

### B. Video Stage (Left Column)
- **Player:** 16:9 aspect ratio, rounded corners, thin border.
- **Overlays:**
    - **Scanning Line:** A horizontal light-cyan line moving vertically across the video.
    - **Bounding Boxes:** Thin cyan rectangles (`#22d3ee`) with soft pulse animations.
    - **Labels:** Floating tags (e.g., "empty coffee mug") above boxes.
- **Timeline:** Scrubber under the video with event markers (tick marks).

### C. Live Bidding Panel (Right - Top)
- **Header:** "Advertiser Agents" with a live agent count.
- **Agent Cards:**
    - **Brand Name:** Bold text.
    - **Bid Amount:** Large monospace (e.g., "£8.40 CPM").
    - **Reasoning:** Italicized subtext (e.g., *"Outdoor leisure scene is high-intent..."*).
    - **Animation:** Cards should slide in or fade in sequentially.
    - **Highlight:** Current high bidder gets a glowing cyan border.

### D. Oversight · Overmind (Right - Middle)
- **Header:** "Oversight · Overmind" with a Shield icon and a "VETO" button.
- **Status Banner:** Large red banner for "BLOCKED — alcohol_x_minor".
- **Audit Log:** Scrolling monospace area with timestamped system messages (e.g., `[bid] North Lager £8.40`).
- **Hierarchy:** This panel is the "Hero" element—most contrast, most visual weight.

### E. Served Placement (Right - Bottom)
- **Content:** Thumbnail of the composited ad, winning brand name, and "Sponsored · <Brand>" disclosure.
- **Action:** "Generate AI Clip (Tier 2)" secondary button.

### F. Status Bar (Bottom)
- **Content:** Small monospace telemetry (e.g., `scene_park_afternoon · 4 agents · 1 blocked · 2nd-price £4.60`).

## 5. Technical Requirements for Implementation
- **Framework:** React or Tailwind CSS recommended for rapid UI development.
- **Icons:** Material Symbols or Lucide icons.
- **Animations:** CSS Keyframes for the scanning line and pulsing boxes; Framer Motion (if using React) for list transitions.
- **Responsiveness:** Targeted for Desktop (1440px+ width).