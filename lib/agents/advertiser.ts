// lib/agents/advertiser.ts
// BACKEND lane — you own this file.
//
// For each Campaign, run an autonomous advertiser agent that:
//   1) calls lib/adapters/tavily.research() to ground the bid in brand + scene context,
//   2) calls lib/adapters/llm.reason() to produce a Bid with human-readable reasoning,
//   3) returns Bid[] (see lib/types.ts).
//
// You do NOT touch API keys. You do NOT touch fetch directly. The adapters
// handle real-vs-fallback transparently — your code is identical either way.
//
// Below is a working PLACEHOLDER you can ship as-is; replace with real
// LLM-driven reasoning. Keep the function signature.

import type { Scene, Campaign, Bid } from "@/lib/types";
import { reason } from "@/lib/adapters/llm";
import { research } from "@/lib/adapters/tavily";

export async function runAgents(scene: Scene, campaigns: Campaign[]): Promise<Bid[]> {
  return Promise.all(campaigns.map((c) => runOneAgent(scene, c)));
}

async function runOneAgent(scene: Scene, campaign: Campaign): Promise<Bid> {
  // 1) Research the brand + scene context via Tavily.
  const query = `${campaign.brand} ${campaign.category} brand placement ${scene.context.slice(0, 80)}`;
  const { snippets } = await research(query);

  // 2) Pick the most relevant slot (cheap heuristic — replace with LLM-driven choice).
  const slot = scene.slots[0];

  // 3) Ask the LLM to produce reasoning + a bid.
  const system =
    "You are an autonomous advertiser-buying agent. You evaluate scenes and decide whether to bid for product placement. Be concise, ground reasoning in the scene + research, and produce a one-paragraph thought process.";
  const user =
`Scene: ${scene.context}
Slots available: ${scene.slots.map((s) => `- ${s.slot_id}: ${s.label}`).join("\n")}
Scene flags: ${scene.flags.join(", ") || "none"}
Brand: ${campaign.brand} (${campaign.category})
Brand guardrails: ${campaign.guardrails.join(", ") || "none"}
Max bid (CPM £): ${campaign.max_bid}
Research:
${snippets.map((s) => `- ${s}`).join("\n")}

Produce one paragraph of reasoning explaining whether and how aggressively to bid.`;

  const reasoning = await reason({ system, user, maxTokens: 300 });

  // 4) Pick a bid amount — naive heuristic so placeholder is testable.
  // Replace with LLM-driven amount-picking if you want more autonomy.
  const bid = pickBidAmount(campaign, scene);

  return {
    agent_id: campaign.agent_id,
    brand: campaign.brand,
    bid,
    reasoning: reasoning.trim(),
    target_slot: slot.slot_id,
    research_snippets: snippets,
  };
}

function pickBidAmount(c: Campaign, scene: Scene): number {
  // Off-daypart penalty (toy): coffee bids lower in afternoon park scenes.
  const offDaypart =
    c.category === "beverage_coffee" && scene.scene_id.includes("afternoon") ? 0.5 : 1.0;
  // Random jitter for variety.
  const jitter = 0.7 + Math.random() * 0.3;
  return Math.round(c.max_bid * offDaypart * jitter * 100) / 100;
}
