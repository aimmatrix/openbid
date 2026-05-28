// lib/auction/engine.ts
// Lane I+S — second-price (Vickrey) auction. Highest bidder wins, pays the
// second-highest bid. Standard for ad exchanges; mention this in the pitch
// if asked.

import type { Bid, AuctionResult, RankedBid } from "@/lib/types";

const SINGLE_BIDDER_FLOOR = 1.0;

/** Deterministic ordering: highest bid wins; ties broken by agent_id ascending. */
function compareBids(a: Bid, b: Bid): number {
  if (b.bid !== a.bid) return b.bid - a.bid;
  return a.agent_id.localeCompare(b.agent_id);
}

export function runAuction(scene_id: string, bids: Bid[]): AuctionResult {
  if (bids.length === 0) {
    throw new Error("runAuction: no bids provided");
  }

  const sorted = [...bids].sort(compareBids);
  const winner = sorted[0];
  // Second-price: winner pays the next-highest bid. Single bidder pays the floor.
  const price = sorted.length > 1 ? sorted[1].bid : SINGLE_BIDDER_FLOOR;

  const ranked_bids: RankedBid[] = sorted.map((bid, i) => ({ ...bid, rank: i + 1 }));

  return { scene_id, winner, price, ranked_bids };
}
