// app/api/run/route.ts
// LANE I+S — orchestration. POST /api/run with { scene_id } and get back
// the full end-to-end response: scene + bids + auction + oversight + render.
//
// Teammates: this is the single endpoint the UI calls. Lane I+S owns it.

import { NextResponse } from "next/server";
import { z } from "zod";
import type { RunResponse } from "@/lib/types";
import { getScene } from "@/lib/scene/analyzer";
import { runAgents } from "@/lib/agents/advertiser";
import { runAuction } from "@/lib/auction/engine";
import { supervise } from "@/lib/oversight/supervisor";
import { render } from "@/lib/render";
import { getCampaigns, reportPlacement } from "@/lib/adapters/thrad";

const BodySchema = z.object({
  scene_id: z.string(),
  tier: z.union([z.literal(1), z.literal(2)]).optional().default(1),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "invalid body", detail: String(err) }, { status: 400 });
  }

  try {
    const scene = getScene(body.scene_id);
    const campaigns = await getCampaigns();
    const bids = await runAgents(scene, campaigns);
    const auction = runAuction(scene.scene_id, bids);
    const oversight = await supervise(scene, auction, campaigns);

    // Render the FINAL winner (could be the runner-up if blocked).
    const finalSlot = scene.slots.find((s) => s.slot_id === oversight.final_winner.target_slot) ?? scene.slots[0];
    const renderResult = await render({
      scene_id: scene.scene_id,
      slot: finalSlot,
      brand: oversight.final_winner.brand,
      tier: body.tier,
    });

    // Report the served placement back to Thrad (or local fallback).
    await reportPlacement(auction);

    const response: RunResponse = {
      scene,
      bids,
      auction,
      oversight,
      render: renderResult,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/run] error", err);
    return NextResponse.json({ error: "run failed", detail: String(err) }, { status: 500 });
  }
}
