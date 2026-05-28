// mocks/bids.ts
// Sample bids — used by Lane C to develop UI before Lane A's real agents are ready.
// Includes the alcohol bid winning a minor_present scene so Lane I+S can verify
// the block-the-unsafe-bid flow.

import type { Bid } from "@/lib/types";

// Bids for scene_kitchen_morning — coffee should win cleanly.
export const bidsKitchen: Bid[] = [
  {
    agent_id: "agent_lumen_coffee",
    brand: "Lumen Coffee",
    bid: 5.4,
    reasoning: "Warm kitchen at sunrise with an empty mug is textbook intent for specialty coffee. Visual aesthetic matches our brand. Bidding aggressively.",
    target_slot: "slot_01",
    research_snippets: [
      "Lumen Coffee Q4 campaign brief: dayparting around morning routine, lifestyle creators (Tubular 2025).",
      "Specialty coffee category showing +12% lift on embedded placements vs traditional pre-roll (IRI 2025).",
    ],
  },
  {
    agent_id: "agent_kindle_fashion",
    brand: "Kindle Apparel",
    bid: 3.1,
    reasoning: "Loose fit. The protagonist's casual look could merchandise our line, but the mug slot is wrong inventory for apparel.",
    target_slot: "slot_02",
    research_snippets: [
      "Kindle Apparel — Q4 push is on outdoor/active, not interior lifestyle (brand brief).",
    ],
  },
  {
    agent_id: "agent_orbit_snacks",
    brand: "Orbit Snacks",
    bid: 2.9,
    reasoning: "Cereal box slot is on-target inventory. Morning daypart fits. Mid-confidence bid.",
    target_slot: "slot_02",
    research_snippets: [
      "Snack category embedded placements: breakfast-context lift is +9% (Tubular Q4 2025).",
    ],
  },
];

// Bids for scene_park_afternoon (minor_present) — alcohol wins on price, must be blocked.
export const bidsPark: Bid[] = [
  {
    agent_id: "agent_north_lager",
    brand: "North Lager",
    bid: 8.4,
    reasoning: "Outdoor leisure scene with picnic drinks is high-intent for lager. Bidding strong to win the slot.",
    target_slot: "slot_03",
    research_snippets: [
      "North Lager — summer campaign explicitly targeting outdoor leisure occasions (brand brief).",
      "Beer category: outdoor scene placements show 2.4x recall vs control (Nielsen 2025).",
    ],
  },
  {
    agent_id: "agent_lumen_coffee",
    brand: "Lumen Coffee",
    bid: 3.2,
    reasoning: "Afternoon outdoor scene is off-daypart for coffee. Low bid as a cover for portfolio diversity.",
    target_slot: "slot_03",
    research_snippets: [
      "Lumen Coffee daypart strategy: morning-skewed; afternoon discount 30% (brand brief).",
    ],
  },
  {
    agent_id: "agent_kindle_fashion",
    brand: "Kindle Apparel",
    bid: 4.6,
    reasoning: "Outdoor casual context fits our Q4 outdoor/active push. T-shirt slot is exactly the inventory we want.",
    target_slot: "slot_04",
    research_snippets: [
      "Kindle Apparel Q4 brief: outdoor/active push, prioritise wearable inventory.",
    ],
  },
];
