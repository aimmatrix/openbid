# OpenBid — Team Onboarding

> **Read this first.** 2 people, ~4-5 hours, 0 merge conflicts.
> Full spec: [`docs/CLAUDE.md`](docs/CLAUDE.md) and [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md).

OpenBid is an autonomous media-buying agent: advertiser agents bid for product
placements inside video, and **every decision is supervised, disclosed, and
human-overridable**. The demo centrepiece is the oversight layer visibly
**blocking an unsafe bid** (alcohol brand in a scene with a minor).

---

## 30-second mental model

Two lanes, disjoint folders. The **backend owner (Ammad)** handles every
external API behind an adapter layer in `lib/adapters/`, plus all the agent /
auction / oversight logic. The **frontend teammate** builds the entire visual
layer — kickstarted by a Google Stitch design (see `STITCH_PROMPT.md`), then
wired to the single `/api/run` endpoint.

| Lane | Owner | Folders you edit |
|---|---|---|
| **Backend** | Ammad | `lib/types.ts`, `lib/adapters/*`, `lib/scene/*`, `lib/agents/*`, `lib/auction/*`, `lib/oversight/*`, `mocks/*`, `app/api/*`, env, configs, `package.json` |
| **Frontend** | Teammate | `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/*`, `lib/render/*` |

**The only shared file is `lib/types.ts` (locked) and `package.json` (Ammad owns).** Everything else, you each own outright. You literally cannot conflict.

---

## Getting started (90 seconds)

```bash
git clone <repo-url>
cd openbid
git checkout frontend     # frontend teammate only; Ammad stays on main
npm install
npm run dev               # http://localhost:3000
```

The backend already works end-to-end against local fallbacks — **no API keys
needed to build the frontend.** `POST /api/run { "scene_id": "...", "tier": 1 }`
returns the full `RunResponse`. When Ammad wires real APIs behind the same
adapters, nothing in the frontend changes.

---

## Conflict-prevention rules

1. **`lib/types.ts` is locked.** Any change = 30-second huddle with Ammad.
2. **Only Ammad edits `package.json`.** Need a dep? Tell Ammad the package name.
3. **Stay in your folders.** Frontend never edits `lib/` except `lib/render/*`. Backend never edits `app/page.tsx`, `components/*`, or `app/globals.css`.
4. **Pull from main often.** Frontend merges main → frontend whenever Ammad ships. Ammad merges frontend → main at integration.
5. **All cross-lane data conforms to `lib/types.ts`.** No `any` at the seam.

---

## The data contract (what `/api/run` returns)

```ts
// POST /api/run  body: { scene_id: string, tier?: 1 | 2 }
interface RunResponse {
  scene:     Scene;             // clip_url, duration, context, flags[], slots[]
  bids:      Bid[];             // agent_id, brand, bid, reasoning, target_slot, research_snippets[]
  auction:   AuctionResult;     // winner, price (second-price), ranked_bids[]
  oversight: OversightDecision; // decision: "approved" | "blocked", reason, triggered_rule?, audit_log[], final_winner
  render:    RenderResult;      // asset_url, tier, disclosure
}
```

Full shapes in [`lib/types.ts`](lib/types.ts). Offline fixtures for frontend dev
are in [`mocks/`](mocks/) — `scenes.ts`, `bids.ts`, `auction.ts` (the last one
has a ready-made BLOCKED decision for building the oversight panel).

Two demo scenes exist:
- `scene_kitchen_morning` — coffee wins cleanly → **approved**
- `scene_park_afternoon` — `minor_present`; alcohol wins on price → **blocked**, runner-up promoted

---

## Frontend lane — paste into Cursor / your agent

> You are building the entire frontend of **OpenBid**, a Track-01 buy-side ad
> agent for the Cursor AdTech London Hackathon. **Your scope ONLY:**
> `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/*`, and
> `lib/render/*`. **DO NOT** edit `lib/types.ts`, `lib/adapters/*`,
> `lib/scene/*`, `lib/agents/*`, `lib/auction/*`, `lib/oversight/*`,
> `app/api/*`, `mocks/*`, or `package.json` — those are the backend lane.
>
> Start from the Google Stitch design (exported code or screenshots — see
> `STITCH_PROMPT.md`). Adapt it into a single-page React + Tailwind dashboard
> with these zones:
>
> 1. **Video player** — the sample clip with **slot bounding boxes overlaid**, animating in at each slot's `timestamp`. Read `scene.slots` (each has a normalized `bbox: [x,y,w,h]`).
> 2. **Live bidding panel** — one card per agent animating its bid + **streaming `reasoning`** and **Tavily `research_snippets`**. Declare a winner.
> 3. **Oversight panel — THE KEY MOMENT.** Render `oversight`: stream the `audit_log`, and when `decision === "blocked"` flag the unsafe bid in **red**, show `triggered_rule` + `reason`, and show the runner-up (`final_winner`) being promoted. Add a human **VETO** button. Make it dramatic and legible from across a room.
> 4. **Render result** — show the winning placement composited on the clip; always show the `disclosure` text ("Sponsored · <brand>").
> 5. **Revenue counter** — ticks up on each approved + rendered placement.
>
> Data flow: `POST /api/run` with `{ scene_id, tier: 1 }`; response is
> `RunResponse` (see `lib/types.ts`). Until the backend confirms `/api/run`,
> develop against fixtures in `mocks/`.
>
> Constraints: NEVER touch `process.env`, API keys, or external `fetch` (internal
> `fetch("/api/run")` is fine). All shapes from `lib/types.ts` — don't invent
> fields. `lib/render/composite.ts` is your Tier-1 logic (CSS overlay is fine);
> `lib/render/index.ts` already routes Tier-2 to the backend's video adapter —
> leave that wiring alone.
>
> Win conditions: **UX clarity** (core) and making the **Overmind block**
> unmissable.

---

## Build timeline (~4–5 hrs to code freeze)

| Time | Ammad (Backend) | Teammate (Frontend) |
|---|---|---|
| :00–:20 | Push repo + brief | Run `STITCH_PROMPT.md` through Google Stitch; export design |
| :20–1:30 | Polish agents + auction + oversight; talk to Overmind reps | Adapt Stitch output into `app/page.tsx` + `components/*` against `mocks/` |
| 1:30–2:30 | Wire real APIs (LLM + Tavily + Overmind); pre-gen Tier-2 backup clip | Build the oversight panel (the block moment) + bidding cards |
| 2:30–3:15 | **Integration:** confirm `/api/run` shape; verify oversight end-to-end | Wire `/api/run` into the page; revenue counter; disclosure overlay |
| 3:15–4:00 | Cursor SDK mention + Alpic MCP if ahead | Lock Tier-1 visuals; Tier-2 fallback |
| 4:00–freeze | Buffer; lock Tier-1 as submission | Polish; rehearse the demo |

**Critical seam:** the oversight panel is the demo's highest-value moment.
Build and verify it first during integration.

---

## Smoke tests

```bash
# Backend (Ammad)
npx tsx lib/oversight/_smoke.ts   # park scene BLOCKED (alcohol_x_minor), kitchen APPROVED
npx tsx lib/agents/_smoke.ts      # 4 bids with reasoning + research

# Frontend (Teammate)
npm run dev                       # visit / — all zones render against mocks
```

---

## End-to-end verification (run at integration)

1. `npm run dev` → http://localhost:3000
2. Trigger the **park** scene → `POST /api/run` with `scene_park_afternoon`
3. Bidding panel streams agents with reasoning + research snippets
4. Auction picks **North Lager** as winner
5. **Oversight shows BLOCKED in red, `alcohol_x_minor`, promotes Kindle Apparel**
6. Render shows Kindle placement with disclosure
7. Revenue ticks up

---

## API keys (Ammad's responsibility — frontend needs none)

Pre-event (tonight):
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` — CRITICAL (agent reasoning)
- `TAVILY_API_KEY` — HIGH (bonus prize, free tier)
- One of `RUNWAY_API_KEY` / `LUMA_API_KEY` / `PIKA_API_KEY` / `VEO_API_KEY` — MEDIUM (Tier-2)

At-event (sponsor reps):
- `OVERMIND_API_KEY` + base URL — Overmind rep (HIGHEST BONUS)
- `ALPIC_*` — Alpic rep (optional, only if ahead)

Full template: [`.env.example`](.env.example).
