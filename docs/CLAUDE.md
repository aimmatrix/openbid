# CLAUDE.md — AdBid Build Handoff

> Single-source build doc for Claude Code. Project: **AdBid** — an autonomous
> media-buying agent for AI-native video ad placement.
> Event: Cursor AdTech London Hackathon · **Track 01: Buy-Side Agents**.
> Team of 3, each with their own coding agents, building in parallel.

---

## 0. Read this first (operating rules for the build)

1. **Contract-first.** `lib/types.ts` defines every shape that crosses a module
   boundary. It is locked before parallel work starts. Nobody edits it alone.
2. **Build against mocks.** Each lane mocks the other two lanes' outputs using
   the contracts, so all three build simultaneously without blocking.
3. **No file collisions.** Each lane owns its folders (see §5). Agents only meet
   at the contract seam.
4. **Every sponsor integration does real work and is visible in the UI.** Judges
   reward genuine use, not badges. Backend-only integration scores nothing
   because no one sees it.
5. **Tiered demo, never a blank screen.** Tier-1 (composited overlay, pre-baked)
   always works and is the code-freeze submission. Tier-2 (live AI video gen) is
   the on-stage stretch, with a pre-generated fallback clip ready.
6. **Swappable layers.** Thrad and Alpic degrade to local equivalents if their
   APIs misbehave. No single sponsor can kill the demo.

---

## 1. What we're building

An autonomous media-buying agent that bids for product placements inside video,
generates the winning ad creative, and can't go off-brand because every decision
is supervised and auditable.

**Demo flow:**
1. Short video clip plays; vision model has detected placement *slots* (empty
   table, blank wall, unbranded cup).
2. 3–4 advertiser agents evaluate the scene and bid in real time, each showing
   reasoning. A winner is declared.
3. Oversight layer supervises every decision — unsafe placements blocked (alcohol
   brand + scene with a minor → blocked, runner-up wins). Human veto + audit log.
   Disclosure marker on every served ad.
4. Winning placement renders — composited overlay (Tier 1) and/or AI-generated
   clip (Tier 2).
5. Running platform-revenue counter.

**The hook:** A team won the Dec 2025 xAI hackathon with "Halftime" — *invisible*
video product placement; widely called creepy. We built the opposite: agents
compete to place, but every ad is disclosed, safety-checked, and human-overridable.

---

## 2. Tech stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Agents:** Anthropic / OpenAI API for reasoning
- **Build/orchestration:** Cursor (SDK + Composer) — also a bonus prize
- **Deploy:** Vercel (and Alpic for MCP endpoints — bonus)

---

## 3. Sponsor integrations (one real job each)

| Sponsor | Layer | Real job in the product | Bonus? |
|---|---|---|---|
| **Cursor** | Build | Dev env + SDK orchestration of parallel agents | ✅ |
| **Thrad** | Data | Advertiser/campaign backbone: brand, budget, guardrails; winning placement reports back as a campaign event | core sponsor |
| **Tavily** | Grounding | Agents research brand + scene context so bids are intelligent, not hardcoded | ✅ |
| **Overmind** | Supervision | Traces every agent decision; catches/flags unsafe bids; audit log | ✅ (highest value) |
| **Alpic** | Deployment | Agent tools / auction served as MCP servers; live endpoint judges can trace repo→endpoint | ✅ |

> **Verify at the event (first 20 min):** Thrad API + Alpic quickstart — get docs
> links and any hackathon keys from their reps. Overmind access too. These three
> I could not fully spec in advance; build the local fallback first, then wire
> the real API.

---

## 4. Data contracts — `lib/types.ts` (LOCK FIRST)

```typescript
// ============ lib/types.ts ============
// The single source of truth for cross-module shapes. Locked before parallel
// work. Edit only as a team.

// --- Scene / slots (Lane A: scene) ---
export interface Slot {
  slot_id: string;        // "slot_01"
  label: string;          // "empty table surface"
  timestamp: number;      // seconds into clip
  bbox: [number, number, number, number]; // [x, y, w, h] normalized 0..1
}

export interface Scene {
  scene_id: string;
  clip_url: string;
  duration: number;
  context: string;        // human-readable scene description for agents
  flags: string[];        // e.g. ["minor_present"] — feeds safety gate
  slots: Slot[];
}

// --- Campaigns (Lane B: Thrad) ---
export interface Campaign {
  agent_id: string;
  brand: string;          // "Lumen Coffee"
  category: string;       // "beverage" | "alcohol" | "fashion" | ...
  budget: number;         // remaining spend
  max_bid: number;        // guardrail
  guardrails: string[];   // e.g. ["no_minors", "no_violence"]
}

// --- Bids (Lane A: agents) ---
export interface Bid {
  agent_id: string;
  brand: string;
  bid: number;            // CPM in £
  reasoning: string;      // shown in UI — the "thinking out loud"
  target_slot: string;    // slot_id
  research_snippets?: string[]; // from Tavily, shown as grounding evidence
}

// --- Auction (Lane B) ---
export interface RankedBid extends Bid { rank: number; }
export interface AuctionResult {
  scene_id: string;
  winner: Bid;
  price: number;          // second-price or first-price; pick one and note it
  ranked_bids: RankedBid[];
}

// --- Oversight (Lane B: Overmind) ---
export interface AuditEntry {
  ts: number;
  agent_id: string;
  action: string;         // "bid" | "research" | "win"
  detail: string;
}
export interface OversightDecision {
  decision: "approved" | "blocked";
  reason: string;         // why blocked/approved — shown in UI
  triggered_rule?: string;// e.g. "alcohol_x_minor"
  audit_log: AuditEntry[];
  final_winner: Bid;      // may differ from auction winner if blocked
}

// --- Render (Lane C) ---
export interface RenderRequest {
  scene_id: string;
  slot: Slot;
  brand: string;
  tier: 1 | 2;            // 1 = composite overlay, 2 = AI-generated
}
export interface RenderResult {
  asset_url: string;
  tier: 1 | 2;
  disclosure: string;     // e.g. "Sponsored · Lumen Coffee"
}
```

---

## 5. File ownership map

```
adbid/
├── lib/
│   ├── types.ts            ← TEAM (lock first, no solo edits)
│   ├── scene/              ← Lane A
│   ├── agents/             ← Lane A  (+ Tavily client)
│   ├── auction/            ← Lane B
│   ├── oversight/          ← Lane B  (+ Overmind client)
│   ├── thrad/              ← Lane B  (campaigns; local fallback)
│   ├── render/             ← Lane C  (composite + text-to-video)
│   └── alpic/              ← shared/optional (MCP deploy)
├── components/             ← Lane C
├── app/                    ← Lane C
└── mocks/                  ← TEAM (fixture data for all lanes)
```

---

## 6. The three lane prompts

> Paste each into that person's Claude Code session. Each is self-contained,
> imports from `lib/types.ts`, and mocks the other lanes.

### ─────────── LANE A — Agents & Intelligence ───────────

```
You are building the "brains" of AdBid, a Track-01 buy-side ad agent for a
hackathon. Your scope ONLY: lib/scene/ and lib/agents/. Import all shared types
from lib/types.ts (already defined — do not edit it). Mock everything from other
lanes using the contracts.

Build:
1. lib/scene/analyzer.ts — exports getScene(sceneId): Scene. For the demo, return
   pre-baked scene data for 1–2 sample clips (hardcode the slots; do NOT attempt
   live vision detection — it's a time sink). Include a `flags` field; one demo
   scene MUST have flags: ["minor_present"] so the safety gate can fire later.
2. lib/agents/advertiser.ts — exports runAgents(scene: Scene, campaigns:
   Campaign[]): Promise<Bid[]>. For each campaign, create an advertiser agent that:
     - uses Tavily to research its brand + the scene context (see Tavily client below),
     - reasons about fit (LLM call) and produces a Bid with human-readable
       `reasoning` and `research_snippets` from Tavily.
   Agents must behave autonomously — no hardcoded bids. Reasoning must reference
   the scene and the research.
3. lib/agents/tavily.ts — thin Tavily search client. Real API if key present
   (process.env.TAVILY_API_KEY), else fall back to mocked snippets so the lane
   never blocks. Tavily is a bonus prize — make the usage real and surface the
   snippets so the UI can show them.

Mock for testing: 3–4 Campaign objects (one alcohol brand for the safety demo,
one coffee, one fashion). Write a quick local test that prints bids + reasoning.

Output contract (must match exactly): Bid[] as defined in lib/types.ts.
Keep it shippable in ~2 hours. Prioritise visible, grounded agent reasoning.
```

### ─────────── LANE B — Marketplace & Oversight ───────────

```
You are building the "spine" of AdBid, a Track-01 buy-side ad agent for a
hackathon. Your scope ONLY: lib/auction/, lib/oversight/, lib/thrad/. Import
shared types from lib/types.ts (do not edit). Mock other lanes via contracts.

Build:
1. lib/thrad/campaigns.ts — exports getCampaigns(): Campaign[]. Wire to the Thrad
   API if available (ask reps for docs/keys at the event); otherwise return local
   campaign fixtures with the SAME shape. Must include guardrails per campaign
   (e.g. ["no_minors"]) and an alcohol-category campaign for the safety demo.
2. lib/auction/engine.ts — exports runAuction(bids: Bid[]): AuctionResult. Rank
   bids, pick a winner, compute price (state whether first- or second-price).
3. lib/oversight/supervisor.ts — exports supervise(scene: Scene, auction:
   AuctionResult, campaigns: Campaign[]): OversightDecision. THIS IS THE HIGHEST-
   VALUE PART. It must:
     - trace every agent decision into audit_log,
     - apply brand-safety rules: if the winning brand's category/guardrails
       conflict with scene.flags (e.g. alcohol + "minor_present"), set
       decision="blocked", triggered_rule, and promote the runner-up as
       final_winner,
     - otherwise approve.
   Integrate Overmind as the supervision/tracing backend (ask reps for access;
   Overmind observes agent runs, detects deviations, keeps queryable traces).
   If no Overmind access, implement the same trace+intervene logic locally with a
   clean interface so it can be swapped. Overmind is the top bonus prize — make it
   do real work (catching the unsafe bid) and expose the audit_log + reason so the
   UI can SHOW the catch.

Mock for testing: import Lane A's Bid[] shape with fixture bids (include a case
where the alcohol brand wins on a minor_present scene, to prove the block fires).

Output contracts (exact): AuctionResult and OversightDecision from lib/types.ts.
The block-the-unsafe-bid moment is the demo's centrepiece — make it unambiguous.
```

### ─────────── LANE C — UI, Demo & Render ───────────

```
You are building the "show" of AdBid, a Track-01 buy-side ad agent for a
hackathon. Your scope ONLY: app/, components/, lib/render/. Import shared types
from lib/types.ts (do not edit). Mock the backend lanes with fixture Scene,
AuctionResult, and OversightDecision objects (in /mocks).

Build a single-page Next.js + React + Tailwind demo with these panels, top to bottom:
1. Video player showing the sample clip with slot bounding-boxes overlaid
   (animate boxes appearing at slot timestamps).
2. Live bidding panel — 3–4 agent cards animating their bids + streaming their
   `reasoning` and Tavily `research_snippets`. Show a winner being declared.
3. Oversight panel — THE KEY MOMENT. Render the OversightDecision: show the
   audit log streaming, and when decision="blocked", visibly flag the unsafe bid
   (red), show triggered_rule + reason, and show the runner-up being promoted.
   Include a human VETO button. This is where the Overmind catch is SEEN — make
   it dramatic and legible.
4. Render result — show the winning placement on the clip. Tier 1: composite the
   brand's product image/logo onto the slot bbox (simple overlay, always works,
   pre-baked). Tier 2 (stretch): call a text-to-video API (Runway/Luma/Pika/Veo)
   to generate a branded clip; if slow/failing, fall back to a pre-generated clip.
   Every rendered ad shows its `disclosure` text.
5. Running platform-revenue counter that ticks up on each served ad.

lib/render/composite.ts (Tier 1) and lib/render/generate.ts (Tier 2) behind a
single render(req: RenderRequest): Promise<RenderResult>.

Make it visually striking and legible from across a room — this wins UX clarity
and carries the live demo. Build Tier 1 fully before attempting Tier 2.
```

---

## 7. Build timeline (~4–5 hrs to code freeze)

| Time | What | Who |
|---|---|---|
| :00–:20 | Lock `lib/types.ts`; write `/mocks` fixtures; assign Thrad+Alpic+Overmind rep errands | Team |
| :20–2:30 | Parallel build against mocks | A / B / C |
| 2:30–3:15 | Integration — replace mocks; test the B→C oversight seam FIRST | Team |
| 3:15–4:00 | Lock Tier-1 demo; pre-generate Tier-2 backup clip; rehearse pitch incl. the catch beat | Team |
| 4:00–freeze | Buffer; lock bulletproof Tier-1 as submission | Team |

**Critical seam:** Lane B's `OversightDecision` → Lane C's oversight panel is the
highest-value moment. Agree the contract in Step 0; integrate and test it first.

---

## 8. Points checklist — maximise the score

### Core rubric (decides 1st/2nd/3rd) — protect these above all
- [ ] **Technical execution** — slot detection + bidding engine + video render all work live
- [ ] **Product thinking** — pitch frames it as monetization infrastructure + Halftime foil
- [ ] **Agent autonomy** — agents visibly research + reason + bid on their own
- [ ] **UX clarity** — bidding, slots, oversight, disclosure all legible at a glance
- [ ] **Real-world applicability** — anchor in the live billion-£ AI-ad market
- [ ] **Safety & oversight design** — the block-the-unsafe-bid moment is unmissable

### Track 01 framing — say these in the pitch
- [ ] When can the agent commit money alone? (auction + spend rules)
- [ ] What counts as a brand-safety violation? (the safety gate)
- [ ] Who signs off on creative before it serves? (human veto + disclosure)

### Bonus prizes (+1 each — must be visible & real)
- [ ] **Tavily** — research snippets shown in the bidding UI
- [ ] **Overmind** — visibly catches the unsafe bid; audit log shown
- [ ] **Cursor** — built via Cursor SDK/Composer (mention the agent orchestration)
- [ ] **Alpic** — auction/agent tools deployed as a live MCP endpoint (optional)

### Demo survival
- [ ] Tier-1 composited version is bulletproof and is the code-freeze submission
- [ ] Tier-2 AI generation attempted live with a pre-generated fallback
- [ ] Pitch rehearsed; each criterion + sponsor named as it appears on screen

---

## 9. Environment / keys

```
ANTHROPIC_API_KEY=        # or OPENAI_API_KEY — agent reasoning
TAVILY_API_KEY=           # agent grounding (bonus)
TEXT_TO_VIDEO_API_KEY=    # Runway / Luma / Pika / Veo (Tier 2)
OVERMIND_*=               # get from reps
THRAD_*=                  # get from reps
ALPIC_*=                  # get from reps (optional)
```

## 10. 2-minute pitch skeleton (engineer / GTM / VC panel)
1. **Hook:** "A team won in December making video ads *invisible*. People called
   it creepy. We built the opposite."
2. **Demo:** scene plays → agents research (Tavily) and bid live → Overmind
   catches an unsafe placement and blocks it → compliant winner renders with
   disclosure → revenue ticks up.
3. **Why it's a company (VCs):** AI-native ad placement is a billion-£ market; the
   moat is the **trust infrastructure** — disclosure, oversight, auditability —
   that brands and regulators will require.
4. **Close:** name each criterion as you land it — autonomy, real-world market,
   human oversight by design.

---

### Notes / caveats
- "AdBid" is a placeholder name — replace with the team's choice.
- Thrad, Alpic, and Overmind API specifics were not verifiable in advance; build
  the local fallback first, then wire the real API after talking to reps.
- Pick first- vs second-price auction and state it; judges may ask.
```

