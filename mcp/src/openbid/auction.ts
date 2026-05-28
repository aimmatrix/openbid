// mcp/src/openbid/auction.ts
// Second-price (Vickrey) auction. Winner pays the next-highest bid; with a
// single bidder we fall back to a small floor so the dashboard never shows £0.

import type { AuctionResult, Bid, RankedBid } from "./types.js";

const SINGLE_BIDDER_FLOOR = 1.0;

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
  const price = sorted.length > 1 ? sorted[1].bid : SINGLE_BIDDER_FLOOR;
  const ranked_bids: RankedBid[] = sorted.map((bid, i) => ({
    ...bid,
    rank: i + 1,
  }));
  return { scene_id, winner, price, ranked_bids };
}
