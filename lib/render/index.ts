// lib/render/index.ts
// LANE C — Teammate 2 owns this file.
//
// Unified entry-point. Tier 1 (composite overlay) is the bulletproof
// submission. Tier 2 (AI-generated) is the on-stage stretch.

import type { RenderRequest, RenderResult } from "@/lib/types";
import { composite } from "./composite";
import { generate } from "@/lib/adapters/render-video";

export async function render(req: RenderRequest): Promise<RenderResult> {
  if (req.tier === 1) return composite(req);
  return generate(req);
}
