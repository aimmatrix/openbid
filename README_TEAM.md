# AdBid — Team Onboarding

> **Read this first.** 3 people, 4-5 hours, 0 merge conflicts.
> Full spec: [`docs/CLAUDE.md`](docs/CLAUDE.md) and [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md).

---

## 30-second mental model

Three lanes, disjoint folders. The integration owner (Ammad) handles **every external API** behind an adapter layer in `lib/adapters/`. You import `reason()`, `research()`, etc. — you never touch a fetch call or an API key.

| Lane | Owner | Folders you edit |
|---|---|---|
| **I+S — Integrations + Spine** | Ammad | `lib/types.ts`, `lib/adapters/*`, `lib/auction/`, `lib/oversight/`, `mocks/`, `app/api/*`, env, configs, `package.json` |
| **A — Brains (agents + scene)** | Teammate 1 | `lib/scene/`, `lib/agents/` |
| **C — Show (UI + render)** | Teammate 2 | `app/page.tsx`, `app/globals.css`, `components/*`, `lib/render/*` |

**You only edit your folders.** Never reach across.

---

## Getting started (90 seconds)

```bash
git clone <repo>
cd cursorhack
git checkout lane-a    # or lane-c
npm install
npm run dev
# open http://localhost:3000
```

Adapters return realistic fixture data without any API keys. You can build and test immediately. When Ammad wires real APIs behind the same `lib/adapters/*` interfaces, your code keeps working unchanged.

---

## Conflict-prevention rules (memorise)

1. **`lib/types.ts` is locked.** Any change = 30-second team huddle with Ammad.
2. **Only Ammad edits `package.json`.** Need a dep? DM Ammad with the package name.
3. **Each lane owns its folders. Never reach across.** Need data from another lane? Use a `/mocks/*` fixture.
4. **Pull from main every 30 min.** Merge to main every 30–60 min — small commits, frequent merges.
5. **All cross-lane data conforms to `lib/types.ts` shapes.** No `any` at module boundaries.
6. **Ammad is the integration broker.** Ship your module → Ammad wires it into `/app/api/run`.

---

## Teammate 1 — LANE A (Brains) — paste into Cursor

> You are building the "brains" of AdBid, a Track-01 buy-side ad agent for the Cursor AdTech London Hackathon. **Your scope ONLY:** `lib/scene/` and `lib/agents/`. **DO NOT** edit `lib/types.ts`, `lib/adapters/*`, `lib/auction/*`, `lib/oversight/*`, `lib/render/*`, `app/api/*`, `mocks/*`, `components/*`, or `package.json` — those belong to other lanes.
>
> Two files already exist as working placeholders — your job is to polish them, not to restructure:
>
> 1. **`lib/scene/analyzer.ts`** — exports `getScene(scene_id): Scene`. Already returns fixture scenes from `mocks/scenes.ts`. You may extend with more scenes; preserve `flags: ["minor_present"]` on at least one scene so the safety gate fires.
>
> 2. **`lib/agents/advertiser.ts`** — exports `runAgents(scene, campaigns): Promise<Bid[]>`. Currently runs a research call (Tavily via `lib/adapters/tavily`), an LLM reasoning call (Anthropic via `lib/adapters/llm`), and a heuristic bid amount. **Your job: make the agent reasoning visibly better.** Each Bid's `reasoning` field is shown live in the UI — it must feel autonomous and grounded.
>
> Constraints:
> - **NEVER touch `process.env`, `fetch`, or any API key.** Use the adapter functions (`reason()`, `research()`) — they handle real-vs-fallback transparently.
> - Bid shape MUST match `lib/types.ts` `Bid` exactly.
> - Agent decisions must be visibly autonomous — bids vary by scene and brand, reasoning references the research snippets.
> - Quick local test: `npx tsx lib/agents/_smoke.ts` should print 4 bids with reasoning before you commit.
>
> Wins for the team:
> - Bonus prize: **Tavily** — `research_snippets` shown in the UI proves the research is real.
> - Core criterion: **Agent autonomy** — bids feel like decisions, not lookups.

---

## Teammate 2 — LANE C (Show) — paste into Cursor

> You are building the "show" of AdBid, a Track-01 buy-side ad agent for the Cursor AdTech London Hackathon. **Your scope ONLY:** `app/page.tsx`, `app/globals.css`, `components/*`, and `lib/render/*`. **DO NOT** edit `lib/types.ts`, `lib/adapters/*`, `lib/auction/*`, `lib/oversight/*`, `lib/scene/*`, `lib/agents/*`, `app/api/*`, `mocks/*`, or `package.json`.
>
> Build a single-page Next.js + React + Tailwind demo. Panels top to bottom:
>
> 1. **Video player** — show the sample clip with **slot bounding boxes overlaid**. Animate boxes appearing at their `timestamp`. Read `Scene.slots` from the response.
>
> 2. **Live bidding panel** — 4 agent cards animating their bids + **streaming their `reasoning`** and **Tavily `research_snippets`**. Show a winner being declared.
>
> 3. **Oversight panel — THE KEY MOMENT.** Render `OversightDecision`: stream the audit log, and when `decision === "blocked"` visibly flag the unsafe bid in red, show `triggered_rule` + `reason`, and show the runner-up being promoted. Include a human **VETO** button. Make this dramatic and legible from across a room.
>
> 4. **Render result** — show the winning placement on the clip. Tier 1: composite the brand label + `disclosure` text onto the slot bbox (CSS overlay, always works). Every rendered ad must show its `disclosure` text.
>
> 5. **Revenue counter** — ticks up each time a placement is approved + rendered.
>
> Data flow:
> - On page load (or button click), POST to `/api/run` with `{ scene_id, tier: 1 }`.
> - Response shape is `RunResponse` (see `lib/types.ts`): `{ scene, bids, auction, oversight, render }`.
> - For development, **mock data is in `mocks/scenes.ts`, `mocks/bids.ts`, `mocks/auction.ts`** — use those directly until Lane I+S confirms `/api/run` is wired.
>
> Constraints:
> - **NEVER touch `process.env`, `fetch` for external APIs, or any API key.** Internal `fetch("/api/run", ...)` is fine.
> - All shapes from `lib/types.ts`. Don't invent fields.
> - `lib/render/composite.ts` is your Tier-1 logic — CSS overlay is fine.
> - `lib/render/index.ts` already routes Tier 2 to `lib/adapters/render-video` — don't touch that.
> - Build Tier 1 fully before attempting Tier 2.
>
> Wins for the team:
> - Core criterion: **UX clarity** — legible from across the room.
> - Bonus assist: **Overmind catch must be visually dramatic.**

---

## Build timeline (~4–5 hrs to code freeze)

| Time | Ammad (I+S) | Teammate 1 (Brains) | Teammate 2 (Show) |
|---|---|---|---|
| :00–:20 | Push scaffold + brief team | Read CLAUDE.md + sketch agent logic | Read CLAUDE.md + sketch UI |
| :20–1:30 | Polish auction + oversight; talk to Overmind + Thrad reps | Build agents reasoning quality | Build VideoPlayer + BiddingPanel + OversightPanel against mocks |
| 1:30–2:30 | Wire real APIs (LLM + Tavily + Thrad + Overmind); pre-gen Tier-2 backup | Polish "thinking out loud" reasoning | Wire `lib/render/composite` Tier 1 + disclosure UI |
| 2:30–3:15 | **Integration:** wire all lanes via `/api/run`. Verify oversight panel first. | Help verify safety gate fires | Wire `/api/run` into `app/page.tsx`; revenue counter |
| 3:15–4:00 | Cursor SDK mention + Alpic MCP if ahead | Demo rehearsal | Lock Tier-1 visuals + Tier-2 fallback |
| 4:00–freeze | Buffer; lock Tier-1 as submission | — | — |

**Critical seam first:** oversight panel (`supervisor` → `OversightPanel`) is the demo's centrepiece. Integrate and verify it before anything else.

---

## Smoke tests (each lane before pushing)

```bash
# Lane I+S
npx tsx lib/oversight/_smoke.ts

# Lane A
npx tsx lib/agents/_smoke.ts

# Lane C
npm run dev   # visit / and check all panels render
```

---

## End-to-end verification (Ammad runs at T+2:30)

1. `npm run dev` → http://localhost:3000
2. Click "Run on park scene" → POST `/api/run` with `scene_park_afternoon`
3. Bidding panel streams agents with reasoning + research snippets
4. Auction picks North Lager as winner
5. **Oversight panel shows BLOCKED in red, `triggered_rule: "alcohol_x_minor"`, promotes Kindle Apparel**
6. Render panel shows Kindle placement with disclosure
7. Revenue ticks up

---

## API keys (Ammad's responsibility)

Pre-event (get tonight):
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` — CRITICAL
- `TAVILY_API_KEY` — HIGH (bonus prize)
- One of `RUNWAY_API_KEY` / `LUMA_API_KEY` / `PIKA_API_KEY` / `VEO_API_KEY` — MEDIUM

At-event (from sponsor reps):
- `THRAD_API_KEY` + base URL — Thrad rep
- `OVERMIND_API_KEY` + base URL — Overmind rep (HIGHEST BONUS)
- `ALPIC_*` — Alpic rep (optional, only if ahead)

See [`.env.example`](.env.example) for full template.
