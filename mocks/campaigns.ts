// mocks/campaigns.ts
// 4 advertiser agents. Must include an ALCOHOL brand with no_minors guardrail
// so the safety gate fires on the minor_present scene.

import type { Campaign } from "@/lib/types";

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
    guardrails: ["no_minors", "no_violence"], // triggers the block on minor_present
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
