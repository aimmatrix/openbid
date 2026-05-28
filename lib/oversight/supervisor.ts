// lib/oversight/supervisor.ts
// Lane I+S — the demo centrepiece. Supervises every auction outcome and
// blocks unsafe placements. Traces research → bid → win → verdict via Overmind.

import type {
  Scene,
  Campaign,
  AuctionResult,
  OversightDecision,
  AuditEntry,
  Bid,
} from "@/lib/types";
import { trace, fetchAuditLog, drainLocalBuffer } from "@/lib/adapters/overmind";
import { findTriggeredRule, isEligible, SAFETY_RULES } from "@/lib/oversight/rules";

type TracePayload = AuditEntry & { scene_id: string };

async function emit(entry: TracePayload): Promise<void> {
  await trace(entry);
}

function campaignFor(campaigns: Campaign[], agent_id: string): Campaign | undefined {
  return campaigns.find((c) => c.agent_id === agent_id);
}

/** Replay the full agent lifecycle into the audit log before rendering a verdict. */
async function traceAuctionLifecycle(
  scene: Scene,
  auction: AuctionResult,
): Promise<void> {
  const now = Date.now();
  const bidders = [...auction.ranked_bids].reverse(); // lowest rank first → chronological feel

  for (let i = 0; i < bidders.length; i++) {
    const ranked = bidders[i];
    const offset = i * 400;

    if (ranked.research_snippets?.length) {
      for (const snippet of ranked.research_snippets) {
        await emit({
          ts: now - (bidders.length - i) * 900 + offset,
          agent_id: ranked.agent_id,
          action: "research",
          detail: `Tavily: ${snippet}`,
          scene_id: scene.scene_id,
        });
      }
    }

    await emit({
      ts: now - (bidders.length - i) * 700 + offset + 200,
      agent_id: ranked.agent_id,
      action: "bid",
      detail: `£${ranked.bid.toFixed(2)} CPM on ${ranked.target_slot} — ${ranked.reasoning.slice(0, 100)}`,
      scene_id: scene.scene_id,
    });
  }

  await emit({
    ts: now - 300,
    agent_id: auction.winner.agent_id,
    action: "win",
    detail: `Auction winner: ${auction.winner.brand} £${auction.winner.bid.toFixed(2)} (clears at £${auction.price.toFixed(2)} second-price)`,
    scene_id: scene.scene_id,
  });
}

function pickEligibleRunnerUp(
  auction: AuctionResult,
  campaigns: Campaign[],
  scene: Scene,
): Bid | undefined {
  for (const ranked of auction.ranked_bids.slice(1)) {
    const campaign = campaignFor(campaigns, ranked.agent_id);
    if (isEligible(scene, campaign)) return ranked;
  }
  return undefined;
}

export async function supervise(
  scene: Scene,
  auction: AuctionResult,
  campaigns: Campaign[],
): Promise<OversightDecision> {
  // Reset this scene's local audit buffer so each run shows only its own
  // entries (Overmind keeps the full cross-run history in the cloud).
  drainLocalBuffer(scene.scene_id);
  await traceAuctionLifecycle(scene, auction);

  const winnerCampaign = campaignFor(campaigns, auction.winner.agent_id);
  const triggered = findTriggeredRule(scene, winnerCampaign);

  if (!triggered) {
    await emit({
      ts: Date.now(),
      agent_id: "supervisor",
      action: "approved",
      detail: `Winner ${auction.winner.brand} cleared all ${SAFETY_RULES.length} safety rules — placement approved`,
      scene_id: scene.scene_id,
    });

    return {
      decision: "approved",
      reason: `Winner ${auction.winner.brand} cleared all safety rules.`,
      audit_log: await fetchAuditLog(scene.scene_id),
      final_winner: auction.winner,
    };
  }

  const promoted = pickEligibleRunnerUp(auction, campaigns, scene);

  await emit({
    ts: Date.now(),
    agent_id: "supervisor",
    action: "blocked",
    detail: `Rule ${triggered.id} — ${auction.winner.brand} blocked${promoted ? `, runner-up ${promoted.brand} promoted` : ", no eligible runner-up"}`,
    scene_id: scene.scene_id,
  });

  if (promoted) {
    await emit({
      ts: Date.now() + 1,
      agent_id: "supervisor",
      action: "promote",
      detail: `${promoted.brand} promoted to final_winner after ${triggered.id} block on ${auction.winner.brand}`,
      scene_id: scene.scene_id,
    });
  }

  return {
    decision: "blocked",
    reason: triggered.reason,
    triggered_rule: triggered.id,
    audit_log: await fetchAuditLog(scene.scene_id),
    final_winner: promoted ?? auction.winner,
  };
}
