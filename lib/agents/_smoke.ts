// lib/agents/_smoke.ts
// Lane A smoke test. Run with: npx tsx lib/agents/_smoke.ts
// Expected: 4 bids printed with reasoning + research snippets.

import { scenes } from "@/mocks/scenes";
import { campaigns } from "@/mocks/campaigns";
import { runAgents } from "@/lib/agents/advertiser";

async function main() {
  const scene = scenes[0]; // kitchen morning
  const bids = await runAgents(scene, campaigns);
  console.log(`--- Bids for ${scene.scene_id} ---`);
  for (const b of bids) {
    console.log(`\n[${b.brand}] £${b.bid.toFixed(2)} CPM on ${b.target_slot}`);
    console.log(`  reasoning: ${b.reasoning.slice(0, 180)}...`);
    console.log(`  research:  ${b.research_snippets?.length ?? 0} snippets`);
  }
  console.assert(bids.length === campaigns.length, "expected one bid per campaign");
  console.log("\nsmoke OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
