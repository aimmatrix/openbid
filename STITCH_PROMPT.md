# Google Stitch Prompt — OpenBid Frontend

> Paste the block below into Google Stitch (https://stitch.withgoogle.com).
> Choose **Web** (desktop). Generate, then iterate with the follow-up prompts
> at the bottom. Export to code/Figma and hand to the frontend lane.

---

## Primary prompt (paste this)

```
Design a single-screen desktop web dashboard for "OpenBid" — an autonomous
media-buying platform where AI advertiser agents bid in real time to place
products inside a video, and an oversight layer blocks unsafe placements. The
mood is a live financial trading terminal crossed with a mission-control
console: dark, high-contrast, dense but legible from across a room, confident
and a little dramatic.

Overall layout: a fixed top bar, then a two-column body. Left column ~60% width
is the video stage; right column ~40% is a vertical stack of live panels. A
slim status strip runs along the bottom.

TOP BAR:
- Left: the wordmark "OpenBid" in a bold geometric font, with a small live
  "● LIVE" pill in green next to it.
- Center: a segmented control to pick the demo scene ("Kitchen — morning",
  "Park — afternoon").
- Right: a large animated "Platform Revenue" counter showing "£0.00" in a
  monospace font with a subtle green glow, and a circular "Run Auction" primary
  button.

LEFT COLUMN — VIDEO STAGE:
- A 16:9 video player filling the column, rounded corners, thin border.
- Overlaid on the video: 2-3 animated bounding boxes ("placement slots") drawn
  as thin cyan rectangles with a small floating label tag above each (e.g.
  "empty coffee mug", "blank t-shirt logo"). Boxes have a soft pulse/scan
  animation as if detected by computer vision.
- A small timeline scrubber under the video with tick marks where slots appear.
- After a winner is chosen, one slot shows a composited brand label inside it
  with a small "Sponsored · <Brand>" disclosure chip pinned to its corner.

RIGHT COLUMN — three stacked panels:

1) LIVE BIDDING panel (top): a header "Advertiser Agents" with a live counter.
   Below, 3-4 agent cards stacked vertically. Each card: a colored brand dot,
   the brand name, the bid amount in large monospace "£8.40 CPM", and a 2-line
   "reasoning" quote in a lighter italic ("Outdoor leisure scene is high-intent
   for lager — bidding strong"). Each card has a tiny "Tavily · 2 sources" chip
   showing the research is grounded. Cards animate in one at a time; the current
   high bidder is highlighted with a glowing border.

2) OVERSIGHT panel (middle) — THE HERO ELEMENT, make it the most dramatic block
   on screen. Header "Oversight · Overmind" with a shield icon. A large status
   banner that can be GREEN ("APPROVED") or RED ("BLOCKED"). In the blocked
   state: a bold red banner reading "BLOCKED — alcohol_x_minor", a one-line
   reason ("Alcohol brand cannot serve in a scene with a minor"), and a visible
   "runner-up promoted" row showing the original winner struck through in red
   and the new winner in green below it. Beneath, a scrolling monospace audit
   log (timestamped lines like "[bid] North Lager £8.40", "[blocked] rule
   alcohol_x_minor"). A prominent human "VETO" button (outlined, danger style)
   sits in the panel header.

3) RENDER RESULT panel (bottom): header "Served Placement". Shows a thumbnail of
   the final composited ad, the winning brand, and a bold "Sponsored · <Brand>"
   disclosure badge. A small "Generate AI clip (Tier 2)" secondary button.

BOTTOM STATUS STRIP: small monospace telemetry — "scene_park_afternoon ·
4 agents · 1 blocked · 2nd-price £4.60" — like a status bar in an IDE.

VISUAL STYLE:
- Palette: near-black background (#0a0a0b), panel surfaces in #141417 with
  1px #26262b borders. Accent cyan (#22d3ee) for detection/slots, green
  (#22c55e) for approved/money, red (#ef4444) for blocked/danger, amber
  (#f59e0b) for pending/warning. Text in cool white and zinc grays.
- Typography: a bold geometric sans for headings, a monospace (like JetBrains
  Mono) for all numbers, bids, timestamps, and the audit log.
- Generous use of subtle glows on the revenue counter and the status banners.
  Rounded-lg cards, thin borders, soft inner shadows. High information density
  but clear hierarchy. Everything should read instantly from 3 meters away.
```

---

## Follow-up prompts (iterate after the first generation)

- "Make the OVERSIGHT panel taller and more dominant — it's the most important
  element. Show the blocked state by default so we can see the red treatment."
- "Add a subtle scanning-line animation over the video to suggest live computer
  vision detecting the slots."
- "Show the bidding cards mid-animation: three visible, the highest bidder
  glowing, one card still sliding in."
- "Tighten the top bar; make the Platform Revenue counter larger with a green
  glow and a small upward trend arrow."
- "Give me a light-on-dark, no-gradient version with flat surfaces for maximum
  legibility on a projector."

---

## Notes for the frontend lane

- Stitch output is a **starting point**, not the final code. Pull the layout,
  spacing, and color system; rewire the data to the real `RunResponse` shape
  from `lib/types.ts`.
- The component breakdown maps cleanly to `components/`: `VideoPlayer`,
  `BiddingPanel`, `OversightPanel`, `RenderResult`, `RevenueCounter`.
- Keep the oversight block dramatic — that's the demo's money moment.
- Every served ad MUST show its `disclosure` text; don't let Stitch drop it.
