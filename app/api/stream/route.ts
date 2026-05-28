// app/api/stream/route.ts
// Server-Sent Events stream of the OpenBid pipeline for live demo polish.
// POST body matches /api/run: { scene_id, tier? }

import { z } from "zod";
import { getScene } from "@/lib/scene/analyzer";
import { runAgents } from "@/lib/agents/advertiser";
import { runAuction } from "@/lib/auction/engine";
import { supervise } from "@/lib/oversight/supervisor";
import { render } from "@/lib/render";
import { getCampaigns, reportPlacement } from "@/lib/campaigns";
import type { RunResponse } from "@/lib/types";

export const runtime = "nodejs";

const BodySchema = z.object({
  scene_id: z.string(),
  tier: z.union([z.literal(1), z.literal(2)]).optional().default(1),
});

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: "invalid body", detail: String(err) }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      try {
        send("phase", { step: "scene", status: "start" });
        const scene = getScene(body.scene_id);
        send("phase", { step: "scene", status: "done", scene_id: scene.scene_id });

        send("phase", { step: "campaigns", status: "start" });
        const campaigns = await getCampaigns();
        send("phase", { step: "campaigns", status: "done", count: campaigns.length });

        send("phase", { step: "bids", status: "start" });
        const bids = await runAgents(scene, campaigns);
        for (const bid of bids) {
          send("bid", bid);
        }
        send("phase", { step: "bids", status: "done", count: bids.length });

        send("phase", { step: "auction", status: "start" });
        const auction = runAuction(scene.scene_id, bids);
        send("auction", auction);
        send("phase", { step: "auction", status: "done", winner: auction.winner.brand });

        send("phase", { step: "oversight", status: "start" });
        const oversight = await supervise(scene, auction, campaigns);
        for (const entry of oversight.audit_log) {
          send("audit", entry);
        }
        send("oversight", oversight);
        send("phase", { step: "oversight", status: "done", decision: oversight.decision });

        send("phase", { step: "render", status: "start" });
        const finalSlot =
          scene.slots.find((s) => s.slot_id === oversight.final_winner.target_slot) ?? scene.slots[0];
        const renderResult = await render({
          scene_id: scene.scene_id,
          slot: finalSlot,
          brand: oversight.final_winner.brand,
          tier: body.tier,
        });
        send("render", renderResult);
        send("phase", { step: "render", status: "done" });

        await reportPlacement(auction);

        const response: RunResponse = { scene, bids, auction, oversight, render: renderResult };
        send("done", response);
      } catch (err) {
        send("error", { message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
