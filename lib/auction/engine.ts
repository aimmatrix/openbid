// lib/auction/engine.ts
// Lane I+S — second-price (Vickrey) auction. Highest bidder wins, pays the
// second-highest bid. Standard for ad exchanges; mention this in the pitch
// if asked.
//
// This is a working skeleton — refine at the event if needed.

import type { Bid, AuctionResult, RankedBid } from "@/lib/types";

export function runAuction(scene_id: string, bids: Bid[]): AuctionResult {
  if (bids.length === 0) {
    throw new Error("runAuction: no bids provided");
  }

  const sorted = [...bids].sort((a, b) => b.bid - a.bid);
  const winner = sorted[0];
  // Second-price: winner pays the next-highest bid. If only one bidder, pay the floor (£1).
  const price = sorted.length > 1 ? sorted[1].bid : 1.0;

  const ranked_bids: RankedBid[] = sorted.map((bid, i) => ({ ...bid, rank: i + 1 }));

  return { scene_id, winner, price, ranked_bids };
}
