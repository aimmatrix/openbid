// ============ lib/types.ts ============
// SINGLE SOURCE OF TRUTH FOR CROSS-MODULE SHAPES.
// LOCKED. Any change requires a 30-second team huddle. No solo edits.
//
// See docs/CLAUDE.md §4 for the canonical spec.

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
  channel?: "video" | "conversational"; // default "video"; "conversational" = ChatGPT-style LLM placement
}

// --- Campaigns (Lane I+S: Thrad adapter) ---
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

// --- Auction (Lane I+S) ---
export interface RankedBid extends Bid {
  rank: number;
}

export interface AuctionResult {
  scene_id: string;
  winner: Bid;
  price: number;          // we use SECOND-PRICE auction (Vickrey). Pitch note: standard for ad exchanges.
  ranked_bids: RankedBid[];
}

// --- Oversight (Lane I+S: Overmind) ---
export interface AuditEntry {
  ts: number;
  agent_id: string;
  action: string;         // "bid" | "research" | "win" | "blocked"
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

// --- End-to-end response shape returned by POST /api/run ---
export interface RunResponse {
  scene: Scene;
  bids: Bid[];
  auction: AuctionResult;
  oversight: OversightDecision;
  render: RenderResult;
}
