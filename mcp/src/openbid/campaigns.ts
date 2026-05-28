// mcp/src/openbid/campaigns.ts
// Active advertiser campaigns. Mirrors mocks/campaigns.ts in the parent app.
// Must include an alcohol brand with no_minors guardrail so the safety gate
// fires on scene_park_afternoon.

import type { Campaign } from "./types.js";

export const campaigns: Campaign[] = [
  {
    agent_id: "agent_lumen_coffee",
    brand: "Lumen Coffee",
    category: "beverage_coffee",
    budget: 12000,
    max_bid: 6.5,
    guardrails: [],
  },
  {
    agent_id: "agent_north_lager",
    brand: "North Lager",
    category: "alcohol",
    budget: 28000,
    max_bid: 9.0,
    guardrails: ["no_minors", "no_violence"],
  },
  {
    agent_id: "agent_kindle_fashion",
    brand: "Kindle Apparel",
    category: "fashion",
    budget: 9000,
    max_bid: 5.0,
    guardrails: [],
  },
  {
    agent_id: "agent_orbit_snacks",
    brand: "Orbit Snacks",
    category: "snack",
    budget: 7500,
    max_bid: 4.2,
    guardrails: [],
  },
];

export function getCampaignByAgentId(agent_id: string): Campaign | undefined {
  return campaigns.find((c) => c.agent_id === agent_id);
}
