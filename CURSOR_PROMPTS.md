# OpenBid — Parallel Build: 3 Cursor Agent Prompts

> **Orchestration model.** The build runs as **4 simultaneous streams** on the
> shared repo (https://github.com/aimmatrix/openbid). Each stream owns a
> **disjoint set of files** — they cannot collide, even on the same branch.
>
> | Stream | Owner | Branch | Files (exclusive) |
> |---|---|---|---|
> | **0 · Agent Intelligence** | Claude (done ✓, on `main`) | `main` | `lib/agents/*`, `lib/scene/*`, `lib/adapters/llm.ts`, `lib/adapters/tavily.ts` |
> | **1 · Marketplace + Oversight** | Cursor Agent A | `spine` | `lib/auction/*`, `lib/oversight/*`, `lib/adapters/overmind.ts` |
> | **2 · Frontend** | Cursor Agent B | `frontend` | `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/*`, `lib/render/composite.ts`, `lib/render/index.ts` |
> | **3 · Data + Deploy** | Cursor Agent C | `plumbing` | `lib/adapters/thrad.ts`, `lib/adapters/render-video.ts`, `lib/adapters/alpic.ts`, `app/api/*` |
>
> **LOCKED (no stream edits without a team huddle):** `lib/types.ts`, `mocks/*`, `package.json`, configs.
>
> Everything already compiles and runs end-to-end against local fallbacks
> (`npm run dev`, then `POST /api/run`). No API keys are required to build —
> Ammad wires real keys behind the adapters later, and nothing in your code
> changes. The shared data contract is `lib/types.ts`; offline fixtures are in
> `mocks/`.
>
> Each prompt below is self-contained. Paste one into each Cursor agent.

---

## The product (context for every agent)

OpenBid is an autonomous media-buying agent: AI advertiser agents bid in real
time to place products inside a video, and an oversight layer blocks unsafe
placements. The demo: a scene plays → agents research + reason + bid → the
winner is chosen → **oversight visibly BLOCKS an unsafe bid** (alcohol brand in
a scene with a minor) and promotes the runner-up → the compliant ad renders with
a disclosure → revenue ticks up. The whole pipeline is one endpoint:
`POST /api/run { scene_id, tier }` → returns `RunResponse` (scene, bids,
auction, oversight, render). Track 01, Cursor AdTech London Hackathon.

---

## ───────── CURSOR AGENT A — Marketplace + Oversight (branch: `spine`) ─────────

```
You are building the marketplace + oversight spine of OpenBid, a Track-01
buy-side ad agent for the Cursor AdTech London Hackathon. This is the demo's
highest-value moment: the oversight layer visibly blocking an unsafe ad bid.

SCOPE — you may ONLY edit these files:
  - lib/auction/engine.ts
  - lib/oversight/supervisor.ts
  - lib/adapters/overmind.ts
  - you may ADD new files inside lib/auction/ or lib/oversight/
DO NOT edit anything else. Specifically NEVER touch: lib/types.ts, mocks/*,
package.json, lib/agents/*, lib/scene/*, lib/adapters/llm.ts,
lib/adapters/tavily.ts, lib/adapters/thrad.ts, lib/adapters/render-video.ts,
app/*, components/*. Those belong to other parallel streams.

Work on the `spine` branch. Pull from main often.

The contracts you implement against (already defined in lib/types.ts — do not
change them):
  runAuction(scene_id: string, bids: Bid[]): AuctionResult
  supervise(scene: Scene, auction: AuctionResult, campaigns: Campaign[]): Promise<OversightDecision>
  Bid           = { agent_id, brand, bid, reasoning, target_slot, research_snippets? }
  AuctionResult = { scene_id, winner, price, ranked_bids: RankedBid[] }
  OversightDecision = { decision: "approved"|"blocked", reason, triggered_rule?, audit_log: AuditEntry[], final_winner: Bid }
  AuditEntry    = { ts, agent_id, action, detail }

A working skeleton already exists in both files — improve it, keep the
signatures. Your goals:

1) AUCTION (lib/auction/engine.ts): keep the second-price (Vickrey) model —
   highest bid wins, pays the second-highest. State this clearly. Make ranking
   robust to ties and to a single bidder (floor price).

2) OVERSIGHT (lib/oversight/supervisor.ts) — THE CENTREPIECE. It must:
   - trace EVERY agent decision into audit_log via lib/adapters/overmind.trace()
     (research → bid → win → verdict). Make the log rich and legible; the UI
     streams it.
   - apply brand-safety rules. The flagship rule: if the winning brand's
     category is "alcohol" AND scene.flags includes "minor_present", set
     decision="blocked", triggered_rule="alcohol_x_minor", and promote the
     highest-ranked ELIGIBLE runner-up as final_winner.
   - add at least one more sensible rule (e.g. a brand whose guardrails include
     "no_violence" on a scene flagged "violence").
   - when nothing triggers, decision="approved", final_winner = auction winner.

3) OVERMIND (lib/adapters/overmind.ts): this adapter already buffers traces
   locally and posts to Overmind when OVERMIND_API_KEY is set. Improve the local
   trace model if helpful (e.g. richer detail), but keep trace() and
   fetchAuditLog() signatures intact so the supervisor and UI keep working. If
   you get real Overmind API docs from Ammad, wire the real calls behind the
   existing functions.

CONSTRAINTS: never read process.env or call external fetch directly outside
lib/adapters/overmind.ts. Use the adapter. All shapes from lib/types.ts.

DEFINITION OF DONE: `npx tsx lib/oversight/_smoke.ts` prints a BLOCKED decision
with triggered_rule "alcohol_x_minor" for the park scene and APPROVED for the
kitchen scene. The audit_log has one entry per agent action plus the verdict.
Make the block unambiguous — it is the moment the whole demo is built around.
```

---

## ───────── CURSOR AGENT B — Frontend (branch: `frontend`) ─────────

```
You are building the entire frontend of OpenBid, a Track-01 buy-side ad agent
for the Cursor AdTech London Hackathon. You win the "UX clarity" score and carry
the live demo. Start from the Google Stitch design (see STITCH_PROMPT.md —
exported code or screenshots) and adapt it; don't design from scratch.

SCOPE — you may ONLY edit these files (and add files under app/ or components/):
  - app/page.tsx, app/layout.tsx, app/globals.css
  - components/*  (create VideoPlayer, BiddingPanel, OversightPanel,
    RenderResult, RevenueCounter, etc.)
  - lib/render/composite.ts, lib/render/index.ts
DO NOT edit anything else. NEVER touch: lib/types.ts, mocks/*, package.json,
lib/agents/*, lib/scene/*, lib/auction/*, lib/oversight/*, lib/adapters/*,
app/api/*. Those are other parallel streams. (You IMPORT from lib/types.ts and
may READ mocks/* for development — just don't edit them.)

Work on the `frontend` branch. Pull from main often.

DATA: one endpoint drives everything.
  POST /api/run  body: { scene_id: string, tier?: 1 | 2 }
  returns RunResponse = { scene, bids, auction, oversight, render }  (see lib/types.ts)
Until the backend confirms /api/run, develop against the fixtures in mocks/:
  mocks/scenes.ts (2 scenes; park has flags ["minor_present"]),
  mocks/bids.ts, mocks/auction.ts (a ready-made BLOCKED OversightDecision).

Build a single-page dashboard, dark "trading-terminal / mission-control" look,
legible from across a room. Five zones:

1) VIDEO PLAYER — the clip with slot bounding boxes overlaid, animating in at
   each slot.timestamp. Each slot has bbox:[x,y,w,h] normalized 0..1 → position
   absolutely over the video. Label each box.
2) LIVE BIDDING — one animated card per agent: brand, bid "£X.XX CPM", the
   streaming `reasoning`, and a "Tavily · N sources" chip showing
   research_snippets. Highlight the current high bidder. Declare a winner.
3) OVERSIGHT PANEL — THE HERO. Render `oversight`: stream the audit_log; when
   decision==="blocked" show a bold RED banner with triggered_rule + reason,
   strike through the blocked winner, and show final_winner promoted in green.
   Add a human "VETO" button. Make it dramatic.
4) RENDER RESULT — show the served placement composited on the clip; ALWAYS
   display the `disclosure` text ("Sponsored · <brand>"). A "Generate AI clip
   (Tier 2)" secondary button that re-runs /api/run with tier:2.
5) REVENUE COUNTER — animated, ticks up on each approved+rendered placement.

lib/render/composite.ts is your Tier-1 logic — a CSS/canvas overlay of the brand
label + disclosure on the slot bbox is perfectly fine (it already returns the
clip URL + disclosure). lib/render/index.ts already routes tier:2 to the backend
video adapter — keep that wiring; don't reimplement it.

CONSTRAINTS: never read process.env, API keys, or call EXTERNAL fetch (internal
fetch("/api/run") is correct). All shapes from lib/types.ts — don't invent
fields. Tailwind is already set up.

DEFINITION OF DONE: `npm run dev` → visiting / lets me trigger each scene and see
all five zones; the park scene shows the oversight BLOCK dramatically and the
runner-up promoted; every rendered ad shows its disclosure. Build Tier 1 fully
before Tier 2.
```

---

## ───────── CURSOR AGENT C — Data + Deploy Plumbing (branch: `plumbing`) ─────────

```
You are building the data + deployment plumbing of OpenBid, a Track-01 buy-side
ad agent for the Cursor AdTech London Hackathon. You own the campaign data feed,
the Tier-2 video generation, the live-endpoint deployment, and the orchestration
route that wires the whole pipeline together.

SCOPE — you may ONLY edit these files (and add files under app/api/):
  - lib/adapters/thrad.ts
  - lib/adapters/render-video.ts
  - lib/adapters/alpic.ts
  - app/api/*  (the orchestration route; you may add app/api/stream/route.ts)
DO NOT edit anything else. NEVER touch: lib/types.ts, mocks/*, package.json,
lib/agents/*, lib/scene/*, lib/auction/*, lib/oversight/*, lib/adapters/llm.ts,
lib/adapters/tavily.ts, lib/adapters/overmind.ts, app/page.tsx, components/*,
lib/render/*. Those are other parallel streams.

Work on the `plumbing` branch. Pull from main often.

Your pieces:

1) THRAD (lib/adapters/thrad.ts): getCampaigns(): Promise<Campaign[]> and
   reportPlacement(result: AuctionResult): Promise<void>. Today it falls back to
   mocks/campaigns.ts when THRAD_API_KEY is missing. When Ammad gets Thrad API
   docs/keys from the reps, wire the real calls behind these two functions —
   real campaign brands/budgets/guardrails in, winning placement reported back
   as a campaign event. Keep the signatures and the local fallback.

2) RENDER-VIDEO (lib/adapters/render-video.ts): generate(req: RenderRequest):
   Promise<RenderResult> for the Tier-2 stretch. Implement ONE real provider
   (Runway, Luma, Pika, or Veo — whichever key Ammad obtains; selected via
   VIDEO_PROVIDER env). Prompt the model with the brand + slot label to produce
   a short branded clip; poll for completion. ALWAYS fall back to
   /clips/tier2-fallback.mp4 on any error or missing key — the demo must never
   break. Keep the disclosure on the result.

3) ALPIC (lib/adapters/alpic.ts): optional bonus. Expose the auction/agent tools
   as an MCP endpoint via Alpic so judges can trace repo→live endpoint. Only
   build if ahead; keep it behind ALPIC_TOKEN with a no-op fallback.

4) ORCHESTRATION (app/api/run/route.ts): the single endpoint. It already chains
   getScene → runAgents → runAuction → supervise → render → reportPlacement and
   returns RunResponse. Keep it robust: validate input, handle errors, return
   clean JSON. The functions you call come from other streams via stable
   signatures in lib/types.ts — do NOT reimplement them, just import and wire.
   Optionally add app/api/stream/route.ts (Server-Sent Events) so the UI can
   stream bids/audit entries live for extra demo polish.

CONSTRAINTS: all external API access lives ONLY in your three adapter files and
reads keys from process.env there. The route must never import process.env
directly. All shapes from lib/types.ts.

DEFINITION OF DONE: `npm run dev`, then
`curl -X POST localhost:3000/api/run -d '{"scene_id":"scene_park_afternoon","tier":1}'`
returns a full RunResponse (200). With no keys set, campaigns come from the
fixture and tier:2 returns the fallback clip — and nothing throws.
```

---

## Integration (when streams converge)

1. Merge order doesn't matter — folders are disjoint. The agent intelligence
   (Stream 0) is already on `main`; merge `spine`, `plumbing`, `frontend` into it.
2. Smoke the seam **oversight → frontend** first (the block moment).
3. Run the end-to-end check in `README_TEAM.md`.
4. Ammad drops real keys into `.env.local`; adapters light up with zero code
   changes in the other streams.
