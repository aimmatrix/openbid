// lib/agents/advertiser.ts
// BACKEND lane — you own this file.
//
// The "brains" of OpenBid. For each Campaign we spin up an autonomous
// advertiser agent that:
//   1) researches its brand + the scene via Tavily (lib/adapters/tavily),
//   2) reasons about fit and decides slot + bid + rationale via an LLM
//      (lib/adapters/llm) returning STRUCTURED JSON — the bid amount is the
//      agent's own decision, not a hardcoded number,
//   3) returns a Bid (lib/types.ts) with human-readable reasoning + the
//      research snippets that grounded it.
//
// Design note: agents bid on COMMERCIAL FIT only. They do NOT self-censor on
// brand-safety — that is the oversight layer's job (lib/oversight). This is
// deliberate: the alcohol agent must be free to win the minor_present scene so
// the supervisor can visibly block it. Agents optimise ROI; the platform
// enforces safety.
//
// Everything degrades gracefully: with no ANTHROPIC/OPENAI key the LLM adapter
// returns prose, JSON parsing fails, and we fall back to a category-aware
// heuristic that still produces varied, believable bids for the demo.

import type { Scene, Campaign, Bid, Slot } from "@/lib/types";
import { reason } from "@/lib/adapters/llm";
import { research } from "@/lib/adapters/tavily";

export async function runAgents(scene: Scene, campaigns: Campaign[]): Promise<Bid[]> {
  // All agents run in parallel — independent decisions, like a real exchange.
  return Promise.all(campaigns.map((c) => runOneAgent(scene, c)));
}

interface AgentDecision {
  target_slot: string;
  bid: number; // CPM in £, 0 = decline
  reasoning: string;
}

async function runOneAgent(scene: Scene, campaign: Campaign): Promise<Bid> {
  const query = `${campaign.brand} ${categoryLabel(campaign.category)} brand — ideal video product-placement context, target audience, recent campaigns`;
  const { snippets } = await research(query);

  const decision = await decideBid(scene, campaign, snippets);

  return {
    agent_id: campaign.agent_id,
    brand: campaign.brand,
    bid: clampBid(decision.bid, campaign),
    reasoning: decision.reasoning,
    target_slot: decision.target_slot,
    research_snippets: snippets,
  };
}

async function decideBid(scene: Scene, campaign: Campaign, snippets: string[]): Promise<AgentDecision> {
  const slotList = scene.slots.map((s) => `- ${s.slot_id}: ${s.label} (appears ${s.timestamp}s)`).join("\n");

  const system =
    `You are the autonomous media-buying agent for ${campaign.brand}, a ${categoryLabel(campaign.category)} brand. ` +
    `You evaluate a single video scene and decide, on your own, whether to bid for a product-placement slot, which slot, and how much (CPM in £, never above your max bid of ${campaign.max_bid}). ` +
    `Think like a sharp performance marketer: audience fit, scene mood, daypart, and the research evidence. ` +
    `Bid aggressively when the fit is strong, low or 0 when it is weak. Bid purely on commercial fit — platform oversight handles brand safety, so do not self-censor. ` +
    `Ground every judgement in the specific scene details and the research provided.`;

  // NOTE: we deliberately do NOT pass scene.flags to the advertiser agent.
  // Safety flags (e.g. minor_present) are the platform's domain — the oversight
  // layer enforces them. The advertiser agent bids on commercial signals only,
  // exactly like a real DSP. This is what lets the oversight catch fire.
  const user =
`SCENE: ${scene.context}
AVAILABLE SLOTS:
${slotList}

YOUR BRAND: ${campaign.brand} (${categoryLabel(campaign.category)})
MAX BID (CPM £): ${campaign.max_bid}
REMAINING BUDGET: £${campaign.budget}

RESEARCH (ground your decision in this):
${snippets.map((s, i) => `[${i + 1}] ${s}`).join("\n")}

Respond with ONLY a JSON object — no prose, no markdown fence:
{"target_slot":"<one slot_id from above>","bid":<number between 0 and ${campaign.max_bid}>,"reasoning":"<2-3 confident sentences that reference this scene and the research>"}`;

  const raw = await reason({ system, user, maxTokens: 450 });
  return parseDecision(raw, scene, campaign, snippets);
}

function parseDecision(raw: string, scene: Scene, campaign: Campaign, snippets: string[]): AgentDecision {
  const json = extractJson(raw);
  if (json && typeof json.bid === "number" && isFinite(json.bid)) {
    const slot = pickValidSlot(String(json.target_slot ?? ""), scene, campaign);
    const reasoning = String(json.reasoning ?? "").trim();
    return {
      target_slot: slot.slot_id,
      bid: json.bid,
      reasoning: reasoning || heuristicReasoning(scene, campaign, slot, snippets),
    };
  }
  // No usable LLM JSON (e.g. no API key) → category-aware heuristic.
  return heuristicDecision(scene, campaign, snippets);
}

// ---------------------------------------------------------------------------
// Heuristic fallback — varied, believable, keyless. Powers the demo before any
// LLM key is wired, and backstops malformed model output.
// ---------------------------------------------------------------------------

function heuristicDecision(scene: Scene, campaign: Campaign, snippets: string[]): AgentDecision {
  const slot = bestSlotFor(campaign, scene);
  const affinity = sceneAffinity(campaign.category, scene); // 0..1
  const jitter = 0.85 + Math.random() * 0.3;
  const bid = Math.round(campaign.max_bid * affinity * jitter * 100) / 100;
  return {
    target_slot: slot.slot_id,
    bid,
    reasoning: heuristicReasoning(scene, campaign, slot, snippets),
  };
}

function heuristicReasoning(scene: Scene, campaign: Campaign, slot: Slot, snippets: string[]): string {
  const affinity = sceneAffinity(campaign.category, scene);
  const strength = affinity > 0.66 ? "strong" : affinity > 0.4 ? "moderate" : "weak";
  const evidence = snippets[0] ? ` Research backs this: ${trimSnippet(snippets[0])}` : "";
  const sceneNoun = scene.context.split(".")[0].toLowerCase();
  return (
    `${campaign.brand} sees a ${strength} fit with ${sceneNoun} — targeting "${slot.label}".` +
    `${evidence} Bidding ${strength === "strong" ? "aggressively to win the slot" : strength === "moderate" ? "competitively" : "defensively for portfolio coverage"}.`
  );
}

// Category → scene affinity in [0,1]. Drives keyless bid amounts so different
// brands behave differently across the two demo scenes.
function sceneAffinity(category: string, scene: Scene): number {
  const ctx = (scene.context + " " + scene.scene_id).toLowerCase();
  const outdoor = /park|outdoor|afternoon|picnic|summer|garden|beach/.test(ctx);
  const indoorMorning = /kitchen|morning|sunrise|home|coffee|breakfast/.test(ctx);

  switch (category) {
    case "alcohol":
      return outdoor ? 0.95 : indoorMorning ? 0.45 : 0.6;
    case "beverage_coffee":
      return indoorMorning ? 0.92 : outdoor ? 0.4 : 0.6;
    case "fashion":
      return outdoor ? 0.78 : 0.62; // wearable inventory works most places
    case "snack":
      return 0.6 + (indoorMorning ? 0.1 : 0); // reliable mid-bidder
    default:
      return 0.55;
  }
}

// Choose the slot whose label best matches the brand category; tie-break to first.
function bestSlotFor(campaign: Campaign, scene: Scene): Slot {
  const keywords = categoryKeywords(campaign.category);
  let best = scene.slots[0];
  let bestScore = -1;
  for (const slot of scene.slots) {
    const label = slot.label.toLowerCase();
    const score = keywords.reduce((acc, k) => acc + (label.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = slot;
    }
  }
  return best;
}

function pickValidSlot(requested: string, scene: Scene, campaign: Campaign): Slot {
  return scene.slots.find((s) => s.slot_id === requested) ?? bestSlotFor(campaign, scene);
}

function categoryKeywords(category: string): string[] {
  switch (category) {
    case "alcohol": return ["drink", "bottle", "glass", "can", "cup"];
    case "beverage_coffee": return ["mug", "cup", "coffee", "drink"];
    case "fashion": return ["shirt", "logo", "jacket", "garment", "wear", "t-shirt"];
    case "snack": return ["box", "shelf", "cereal", "pack", "snack"];
    default: return [];
  }
}

function categoryLabel(category: string): string {
  return category.replace(/_/g, " ");
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function clampBid(bid: number, campaign: Campaign): number {
  const safe = Number.isFinite(bid) ? bid : 0;
  return Math.max(0, Math.min(safe, campaign.max_bid));
}

function trimSnippet(s: string, max = 120): string {
  return s.length > max ? s.slice(0, max).trimEnd() + "…" : s;
}

// Pull the first JSON object out of an LLM response, tolerating ```json fences
// and surrounding prose.
function extractJson(raw: string): { target_slot?: unknown; bid?: number; reasoning?: unknown } | null {
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
