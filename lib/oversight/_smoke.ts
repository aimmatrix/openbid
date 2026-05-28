// lib/oversight/_smoke.ts
// Lane I+S smoke test. Run with: npx tsx lib/oversight/_smoke.ts
// Expected output: BLOCKED decision with triggered_rule "alcohol_x_minor"
// for the minor_present park scene + APPROVED for the kitchen scene.

import { scenes } from "@/mocks/scenes";
import { campaigns } from "@/mocks/campaigns";
import { sampleAuctionPark } from "@/mocks/auction";
import { runAuction } from "@/lib/auction/engine";
import { bidsKitchen } from "@/mocks/bids";
import { supervise } from "@/lib/oversight/supervisor";

async function main() {
  // Case 1: park scene — alcohol wins → SHOULD BE BLOCKED.
  const parkScene = scenes.find((s) => s.scene_id === "scene_park_afternoon")!;
  const parkOversight = await supervise(parkScene, sampleAuctionPark, campaigns);
  console.log("--- PARK SCENE (minor_present + alcohol winner) ---");
  console.log("decision:        ", parkOversight.decision);
  console.log("triggered_rule:  ", parkOversight.triggered_rule);
  console.log("reason:          ", parkOversight.reason);
  console.log("final_winner:    ", parkOversight.final_winner.brand);
  console.log("audit log size:  ", parkOversight.audit_log.length);
  console.assert(parkOversight.decision === "blocked", "park scene should be BLOCKED");

  // Case 2: kitchen scene — coffee wins cleanly → APPROVED.
  const kitchenScene = scenes.find((s) => s.scene_id === "scene_kitchen_morning")!;
  const kitchenAuction = runAuction(kitchenScene.scene_id, bidsKitchen);
  const kitchenOversight = await supervise(kitchenScene, kitchenAuction, campaigns);
  console.log("\n--- KITCHEN SCENE (no flags + coffee winner) ---");
  console.log("decision:        ", kitchenOversight.decision);
  console.log("final_winner:    ", kitchenOversight.final_winner.brand);
  console.log("price:           ", kitchenAuction.price);
  console.assert(kitchenOversight.decision === "approved", "kitchen scene should be APPROVED");

  console.log("\nsmoke OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
