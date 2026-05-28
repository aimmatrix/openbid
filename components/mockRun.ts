import type { RunResponse } from "@/lib/types";
import { runAuction } from "@/lib/auction/engine";
import { getSceneById } from "@/mocks/scenes";
import { bidsKitchen, bidsPark } from "@/mocks/bids";
import { sampleAuctionPark, sampleOversightBlocked } from "@/mocks/auction";

/** Client-side fallback when /api/run is unavailable during UI development. */
export function buildMockRunResponse(scene_id: string, tier: 1 | 2 = 1): RunResponse {
  const scene = getSceneById(scene_id);
  if (!scene) {
    throw new Error(`Unknown scene: ${scene_id}`);
  }

  if (scene_id === "scene_park_afternoon") {
    const finalWinner = sampleOversightBlocked.final_winner;
    return {
      scene,
      bids: bidsPark,
      auction: sampleAuctionPark,
      oversight: sampleOversightBlocked,
      render: {
        asset_url: scene.clip_url,
        tier,
        disclosure: `Sponsored · ${finalWinner.brand}`,
      },
    };
  }

  const bids = bidsKitchen;
  const auction = runAuction(scene.scene_id, bids);
  const winner = auction.winner;
  const now = Date.now();

  return {
    scene,
    bids,
    auction,
    oversight: {
      decision: "approved",
      reason: "All brand-safety checks passed. No scene flags conflict with winner guardrails.",
      audit_log: [
        { ts: now - 4800, agent_id: winner.agent_id, action: "research", detail: "Tavily: morning coffee lift +12%" },
        { ts: now - 4200, agent_id: "agent_orbit_snacks", action: "bid", detail: "£2.90 CPM on slot_02" },
        { ts: now - 4000, agent_id: "agent_kindle_fashion", action: "bid", detail: "£3.10 CPM on slot_02" },
        { ts: now - 3800, agent_id: winner.agent_id, action: "bid", detail: `£${winner.bid.toFixed(2)} CPM on ${winner.target_slot}` },
        { ts: now - 3200, agent_id: winner.agent_id, action: "win", detail: `Auction winner: ${winner.brand}` },
        { ts: now - 800, agent_id: "supervisor", action: "approved", detail: "No policy violations — placement cleared" },
      ],
      final_winner: winner,
    },
    render: {
      asset_url: scene.clip_url,
      tier,
      disclosure: `Sponsored · ${winner.brand}`,
    },
  };
}
