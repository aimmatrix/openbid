// mcp/src/openbid/oversight.ts
// Brand-safety rules + supervisor verdict. Slim copy of the parent app's
// lib/oversight/{rules,supervisor}.ts — we drop the Overmind trace plumbing
// because this MCP server is the public face and shouldn't carry telemetry
// secrets. The rules are identical, so the verdict matches the main app.

import type {
  AuctionResult,
  Bid,
  Campaign,
  OversightDecision,
  Scene,
} from "./types.js";
import { getCampaignByAgentId } from "./campaigns.js";

interface SafetyRule {
  id: string;
  reason: string;
  matches: (scene: Scene, campaign: Campaign | undefined) => boolean;
}

export const SAFETY_RULES: SafetyRule[] = [
  {
    id: "alcohol_x_minor",
    matches: (scene, c) =>
      !!c && c.category === "alcohol" && scene.flags.includes("minor_present"),
    reason:
      "Alcohol-category brand cannot serve in scenes flagged minor_present. Promoting runner-up.",
  },
  {
    id: "violence_guardrail",
    matches: (scene, c) =>
      !!c &&
      c.guardrails.includes("no_violence") &&
      scene.flags.includes("violence"),
    reason:
      "Brand has no_violence guardrail; scene contains violence. Promoting runner-up.",
  },
];

function findTriggeredRule(
  scene: Scene,
  campaign: Campaign | undefined,
): SafetyRule | undefined {
  return SAFETY_RULES.find((rule) => rule.matches(scene, campaign));
}

function isEligible(scene: Scene, campaign: Campaign | undefined): boolean {
  return !findTriggeredRule(scene, campaign);
}

function pickEligibleRunnerUp(
  auction: AuctionResult,
  scene: Scene,
): Bid | undefined {
  for (const ranked of auction.ranked_bids.slice(1)) {
    const campaign = getCampaignByAgentId(ranked.agent_id);
    if (isEligible(scene, campaign)) return ranked;
  }
  return undefined;
}

export function supervise(
  scene: Scene,
  auction: AuctionResult,
): OversightDecision {
  const winnerCampaign = getCampaignByAgentId(auction.winner.agent_id);
  const triggered = findTriggeredRule(scene, winnerCampaign);

  if (!triggered) {
    return {
      decision: "approved",
      reason: `Winner ${auction.winner.brand} cleared all safety rules.`,
      final_winner: auction.winner,
    };
  }

  const promoted = pickEligibleRunnerUp(auction, scene);
  return {
    decision: "blocked",
    reason: triggered.reason,
    triggered_rule: triggered.id,
    final_winner: promoted ?? auction.winner,
  };
}
