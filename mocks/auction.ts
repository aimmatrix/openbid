// mocks/auction.ts
// Sample auction outcome + a sample oversight decision for the dramatic
// "alcohol gets blocked, coffee promoted" demo moment. Lane C uses these
// to develop the OversightPanel before Lane I+S has wired the real engine.

import type { AuctionResult, OversightDecision } from "@/lib/types";
import { bidsPark } from "./bids";

export const sampleAuctionPark: AuctionResult = {
  scene_id: "scene_park_afternoon",
  winner: bidsPark[0], // North Lager
  price: 4.6, // second-price = next highest bid (Kindle's £4.60)
  ranked_bids: [
    { ...bidsPark[0], rank: 1 },
    { ...bidsPark[2], rank: 2 },
    { ...bidsPark[1], rank: 3 },
  ],
};

export const sampleOversightBlocked: OversightDecision = {
  decision: "blocked",
  reason: "Alcohol-category brand cannot serve in scenes flagged minor_present. Promoting runner-up.",
  triggered_rule: "alcohol_x_minor",
  audit_log: [
    { ts: Date.now() - 5000, agent_id: "agent_north_lager",   action: "research", detail: "Tavily: outdoor leisure lift +2.4x" },
    { ts: Date.now() - 4500, agent_id: "agent_north_lager",   action: "bid",      detail: "£8.40 CPM on slot_03 (unbranded drink)" },
    { ts: Date.now() - 4200, agent_id: "agent_lumen_coffee",  action: "bid",      detail: "£3.20 CPM on slot_03 (defensive)" },
    { ts: Date.now() - 4000, agent_id: "agent_kindle_fashion", action: "bid",     detail: "£4.60 CPM on slot_04 (apparel inventory)" },
    { ts: Date.now() - 3000, agent_id: "agent_north_lager",   action: "win",      detail: "Auction winner: North Lager £8.40" },
    { ts: Date.now() - 200,  agent_id: "supervisor",          action: "blocked",  detail: "Rule alcohol_x_minor — North Lager blocked, runner-up Kindle Apparel promoted" },
  ],
  final_winner: bidsPark[2], // Kindle Apparel (rank 2)
};
