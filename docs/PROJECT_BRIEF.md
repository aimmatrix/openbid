# OpenBid — Autonomous Media-Buying Agent for AI-Native Video Placement

**Cursor AdTech London Hackathon · Track 01: Buy-Side Agents**

---

## One-line pitch

An autonomous media-buying agent that bids for product placements inside video, generates the winning ad creative — and can't go off-brand, because every decision is supervised and auditable.

## The hook (the foil)

In December, a team won the xAI hackathon with "Halftime" — invisible product placement inside video. People called it creepy. We built the opposite: ads agents compete to place, but **every single one is disclosed, safety-checked, and human-overridable**. Same magic, earned trust.

---

## What it does (demo flow)

1. **Scene analysis** — a short video clip plays; a vision model has detected "slots" where a product could go (empty table, blank wall, character holding an unbranded cup).
2. **The marketplace** — 3–4 advertiser agents evaluate the scene and bid in real time to win a slot. Each shows its reasoning out loud ("cozy kitchen → my coffee brand fits → bidding £4.20 CPM"). A winner is declared.
3. **The oversight layer** — before the winning ad serves, every agent decision is supervised. Unsafe placements are caught and blocked (e.g. an alcohol brand in a scene with a minor → blocked, runner-up wins). A human veto button and a full audit log are exposed. Every served ad carries a visible disclosure marker.
4. **The payoff** — the winning brand's placement renders into the video: a composited overlay (safe tier) and/or a freshly AI-generated ad clip (stretch tier).
5. **Revenue** — a running platform-revenue counter ties it back to monetization infrastructure.

---

## Why this scores (mapping to the rubric)

### Core criteria (decides 1st/2nd/3rd)
- **Technical execution** — vision slot-detection + real-time bidding engine + video generation.
- **Product thinking** — it's monetization infrastructure, not a toy; the Halftime foil shows market understanding.
- **Agent autonomy** — multiple advertiser agents independently research, reason, and bid without being told what to do.
- **UX clarity** — animated bidding, slot boxes on the video, oversight panel, disclosure markers — legible at a glance.
- **Real-world applicability** — AI-native video ad placement is a live, billion-pound market (X is shipping AI ad tools now).
- **Safety & oversight design** — the differentiator. Most teams skip this; we have a whole layer (safety gate, human veto, audit log, disclosure). Equally weighted, and likely our path into the top 3.

### Track 01 fit (Buy-Side Agents)
Answers the track's three human-in-the-loop questions directly:
- *When can the agent commit money alone?* → auction engine + spend escalation rules.
- *What counts as a brand-safety violation?* → the oversight layer's safety gate.
- *Who signs off on creative before it serves?* → human veto + disclosure before render.

### Bonus prizes (+1 each, must be real work — "not a throwaway badge")
- **Tavily** — agents research their brand + scene context live to ground bids.
- **Overmind** — supervises every agent decision, catches unsafe bids, keeps the audit trail. *Our highest-value integration.*
- **Cursor** — built via Cursor SDK + Composer to orchestrate the parallel build agents.
- **Alpic** — agent tools / auction service deployed as MCP servers with a live, traceable endpoint (optional, if ahead).

---

## Sponsor integrations (one real job each — no badges)

| Sponsor | Layer | Real job |
|---|---|---|
| **Cursor** | Build | Dev environment + SDK orchestration of parallel agents |
| **Thrad** | Data | Advertiser/campaign backbone — brand, budget, guardrails; winning placement reports back |
| **Tavily** | Grounding | Agents research brands + scene context so bids are intelligent, not hardcoded |
| **Overmind** | Supervision | Traces every decision; catches/flags unsafe bids; audit log |
| **Alpic** | Deployment | Hosts agent tools / auction as MCP servers; live endpoint judges can trace |

**Discipline:** every integration is a swappable layer with a local fallback. Thrad and Alpic degrade gracefully to local equivalents if their APIs misbehave, so no single sponsor failure can kill the demo.

---

## Architecture

```
Scene analyzer (vision → slots)
        ↓
Advertiser agents (research via Tavily, reason, bid)   ← campaigns from Thrad
        ↓
Auction engine (rank bids, pick winner)
        ↓
Oversight layer (Overmind: trace, safety-gate, veto, audit)
        ↓
Render + UI (composited overlay [Tier 1] / AI-generated clip [Tier 2], disclosure, revenue counter)

Built in Cursor (SDK-orchestrated agents) · served via Alpic (MCP endpoints)
```

### Data contracts (`/lib/types.ts` — lock first, owned by the team, nobody edits alone)
- **Slot:** `{ slot_id, label, timestamp, bbox }`
- **Bid:** `{ agent_id, brand, bid, reasoning, target_slot }`
- **AuctionResult:** `{ winner, price, ranked_bids[] }`
- **OversightDecision:** `{ decision: approved | blocked, reason, audit_log[] }`

---

## Team lanes (3 people, build in parallel)

### Step 0 — together (first 20 min)
Lock `types.ts` as a team, freeze it, then split. Assign the Thrad + Alpic rep errands to the relevant lanes.

### Person A — Agents & Intelligence (the brains)
- **Owns:** `/lib/agents/`, `/lib/scene/`, Tavily integration
- **Builds:** 3–4 advertiser agents, scene-slot data, Tavily grounding
- **Scores:** Agent autonomy (core) + Tavily bonus

### Person B — Marketplace & Oversight (the spine)
- **Owns:** `/lib/auction/`, `/lib/oversight/`, Overmind + Thrad integration
- **Builds:** bidding engine, Overmind supervision/safety layer, audit log, Thrad campaigns
- **Scores:** Safety & oversight (core) + Overmind bonus + Thrad fit
- *Heaviest lane — strongest backend person.*

### Person C — UI, Demo & Render (the show)
- **Owns:** `/components/`, `/app/`, video render + text-to-video
- **Builds:** front end (video player, animated bidding, oversight panel, disclosure, revenue counter), Tier-1 overlay + Tier-2 AI generation
- **Scores:** UX clarity + creative generation (core); wins the live demo
- *Strongest React person.*

### Shared / whoever's ahead
- **Cursor SDK orchestration** (bonus) → A or B
- **Alpic deployment** (bonus, optional) → B or C, only if ahead

**Critical seam:** B's oversight output → C's UI panel is where the highest-value moment lives (Overmind visibly catching the bad bid). Agree this contract in Step 0; test it first during integration.

---

## Timeline (~4–5 hrs to code freeze)

| Time | What |
|---|---|
| :00–:20 | Together: lock `types.ts`, assign rep errands |
| :20–2:30 | Three lanes build in parallel against mocked contracts |
| 2:30–3:15 | Integration — replace mocks with real modules |
| 3:15–4:00 | Lock bulletproof demo; pre-generate backup video; rehearse script (incl. the Overmind-catch beat) |
| 4:00–freeze | Buffer + lock Tier-1 version as submission |

**Two-stage demo:** code-freeze submission must be bulletproof (Tier-1) to make the top-5 cut; attempt the ambitious live AI generation (Tier-2) only once on stage, with a pre-generated fallback ready.

---

## Keys / accounts to line up before arriving
- Tavily API key
- Text-to-video key (Runway / Luma / Pika / Veo — whichever is obtainable)
- Anthropic / OpenAI key (agent reasoning)
- Overmind access (ask reps)
- Thrad API + Alpic quickstart (get from reps in first 20 min)

---

## 2-minute pitch skeleton (engineer / GTM / VC panel)
1. **Hook (foil):** "A team won in December by making video ads invisible. People called it creepy. We built the opposite."
2. **Demo:** scene plays → agents research via Tavily and bid live → Overmind catches an unsafe placement and blocks it → compliant winner renders with disclosure → revenue ticks up.
3. **Why it's a company (VCs):** AI-native ad placement is a billion-pound market; the moat isn't the placement — it's the **trust infrastructure** (disclosure, oversight, auditability) brands and regulators will require.
4. **Close:** name each criterion as you land it — autonomous agents, real-world market, human oversight by design.
