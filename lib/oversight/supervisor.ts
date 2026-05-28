// lib/oversight/supervisor.ts
// Lane I+S — the demo centrepiece. Supervises every auction outcome and
// blocks unsafe placements. Currently implements one rule (alcohol_x_minor);
// add more rules as new sponsor scenarios come up.
//
// Uses lib/adapters/overmind to trace every decision; in the absence of an
// OVERMIND_API_KEY the buffer stays local but the API is identical.

import type { Scene, Campaign, AuctionResult, OversightDecision, AuditEntry, Bid } from "@/lib/types";
import { trace, fetchAuditLog } from "@/lib/adapters/overmind";

interface SafetyRule {
  id: string;
  matches: (scene: Scene, winnerCampaign: Campaign | undefined) => boolean;
  reason: string;
}

const RULES: SafetyRule[] = [
  {
    id: "alcohol_x_minor",
    matches: (scene, c) =>
      !!c && c.category === "alcohol" && scene.flags.includes("minor_present"),
    reason: "Alcohol-category brand cannot serve in scenes flagged minor_present. Promoting runner-up.",
  },
  {
    id: "violence_guardrail",
    matches: (scene, c) =>
      !!c && c.guardrails.includes("no_violence") && scene.flags.includes("violence"),
    reason: "Brand has no_violence guardrail; scene contains violence. Promoting runner-up.",
  },
];

export async function supervise(
  scene: Scene,
  auction: AuctionResult,
  campaigns: Campaign[],
): Promise<OversightDecision> {
  // Replay every bid into the trace log.
  for (const ranked of auction.ranked_bids) {
    const entry: AuditEntry = {
      ts: Date.now(),
      agent_id: ranked.agent_id,
      action: ranked.agent_id === auction.winner.agent_id ? "win" : "bid",
      detail: `£${ranked.bid.toFixed(2)} CPM on ${ranked.target_slot} — ${ranked.reasoning.slice(0, 80)}`,
    };
    await trace({ ...entry, scene_id: scene.scene_id });
  }

  const winnerCampaign = campaigns.find((c) => c.agent_id === auction.winner.agent_id);

  // Find a triggered rule, if any.
  const triggered = RULES.find((r) => r.matches(scene, winnerCampaign));

  if (!triggered) {
    await trace({
      ts: Date.now(),
      agent_id: "supervisor",
      action: "approved",
      detail: `Winner ${auction.winner.brand} approved (no rules triggered)`,
      scene_id: scene.scene_id,
    } as AuditEntry & { scene_id: string });

    return {
      decision: "approved",
      reason: `Winner ${auction.winner.brand} cleared all safety rules.`,
      audit_log: await fetchAuditLog(scene.scene_id),
      final_winner: auction.winner,
    };
  }

  // Blocked — promote the next eligible runner-up.
  const promoted = pickRunnerUp(auction, campaigns, scene, triggered.id);

  await trace({
    ts: Date.now(),
    agent_id: "supervisor",
    action: "blocked",
    detail: `Rule ${triggered.id} — ${auction.winner.brand} blocked, ${promoted?.brand ?? "no eligible runner-up"} promoted`,
    scene_id: scene.scene_id,
  } as AuditEntry & { scene_id: string });

  return {
    decision: "blocked",
    reason: triggered.reason,
    triggered_rule: triggered.id,
    audit_log: await fetchAuditLog(scene.scene_id),
    final_winner: promoted ?? auction.winner, // if no eligible runner-up, return original (UI shows blocked anyway)
  };
}

function pickRunnerUp(
  auction: AuctionResult,
  campaigns: Campaign[],
  scene: Scene,
  failedRuleId: string,
): Bid | undefined {
  for (const ranked of auction.ranked_bids.slice(1)) {
    const c = campaigns.find((x) => x.agent_id === ranked.agent_id);
    // If this candidate would also trigger the same rule, skip them.
    const failedRule = RULES.find((r) => r.id === failedRuleId);
    if (failedRule && failedRule.matches(scene, c)) continue;
    return ranked;
  }
  return undefined;
}
