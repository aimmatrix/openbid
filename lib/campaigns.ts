// lib/campaigns.ts
// Local campaign source. (Thrad was dropped from scope — campaigns now come
// straight from fixtures; no external advertiser backbone.)

import type { Campaign, AuctionResult } from "@/lib/types";
import { campaigns as fixtures } from "@/mocks/campaigns";

export async function getCampaigns(): Promise<Campaign[]> {
  return fixtures;
}

// Kept as a local hook so the served-placement event is still observable.
// Previously reported to Thrad; now just logged.
export async function reportPlacement(result: AuctionResult): Promise<void> {
  console.log(
    "[placement] served",
    result.scene_id,
    result.winner.brand,
    `£${result.price.toFixed(2)} CPM`,
  );
}
