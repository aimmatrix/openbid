// app/api/run/route.ts
// LANE I+S — orchestration. POST /api/run with { scene_id, tier? } and get back
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
import { getCampaigns, reportPlacement } from "@/lib/campaigns";

const BodySchema = z.object({
  scene_id: z.string().min(1),
  tier: z.union([z.literal(1), z.literal(2)]).optional().default(1),
});

function errorResponse(status: number, error: string, detail?: string) {
  return NextResponse.json({ error, ...(detail ? { detail } : {}) }, { status });
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse(400, "invalid body", "request body must be JSON");
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid body", parsed.error.message);
  }
  const body = parsed.data;

  try {
    const scene = getScene(body.scene_id);
    const campaigns = await getCampaigns();
    const bids = await runAgents(scene, campaigns);

    if (bids.length === 0) {
      return errorResponse(500, "run failed", "no bids returned from agents");
    }

    const auction = runAuction(scene.scene_id, bids);
    const oversight = await supervise(scene, auction, campaigns);

    const finalSlot =
      scene.slots.find((s) => s.slot_id === oversight.final_winner.target_slot) ?? scene.slots[0];

    const renderResult = await render({
      scene_id: scene.scene_id,
      slot: finalSlot,
      brand: oversight.final_winner.brand,
      tier: body.tier,
    });

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
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[/api/run] error", detail);
    const status = detail.startsWith("Unknown scene:") ? 404 : 500;
    return errorResponse(status, status === 404 ? "scene not found" : "run failed", detail);
  }
}
