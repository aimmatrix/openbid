// mcp/src/openbid/types.ts
// Slim copy of the parent project's lib/types.ts. We only need the shapes
// that cross the MCP boundary — agents/render/Overmind types live in the
// parent Next.js app and aren't exposed via MCP.

export interface Slot {
  slot_id: string;
  label: string;
  timestamp: number;
  bbox: [number, number, number, number];
}

export interface Scene {
  scene_id: string;
  clip_url: string;
  duration: number;
  context: string;
  flags: string[];
  slots: Slot[];
}

export interface Campaign {
  agent_id: string;
  brand: string;
  category: string;
  budget: number;
  max_bid: number;
  guardrails: string[];
}

export interface Bid {
  agent_id: string;
  brand: string;
  bid: number;
  reasoning: string;
  target_slot: string;
  research_snippets?: string[];
}

export interface RankedBid extends Bid {
  rank: number;
}

export interface AuctionResult {
  scene_id: string;
  winner: Bid;
  price: number;
  ranked_bids: RankedBid[];
}

export interface OversightDecision {
  decision: "approved" | "blocked";
  reason: string;
  triggered_rule?: string;
  final_winner: Bid;
}

export interface SimulationResult {
  scene: Scene;
  auction: AuctionResult;
  oversight: OversightDecision;
}
