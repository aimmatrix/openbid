// lib/render/composite.ts
// FRONTEND lane — your teammate owns this file.
//
// Tier-1 render: a deterministic, always-works composite overlay on the
// existing clip. The simplest implementation: return the original clip URL
// and let the UI overlay the brand logo + disclosure on top with CSS.
//
// Refine if you want fancier compositing (canvas, server-side ffmpeg, etc.).

import type { RenderRequest, RenderResult } from "@/lib/types";

export async function composite(req: RenderRequest): Promise<RenderResult> {
  // The UI overlays the brand label + disclosure on the bbox at the slot's timestamp.
  // No server-side video processing needed for Tier 1.
  return {
    asset_url: `/clips/${req.scene_id}.mp4`,
    tier: 1,
    disclosure: `Sponsored · ${req.brand}`,
  };
}
