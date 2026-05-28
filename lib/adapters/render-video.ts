// lib/adapters/render-video.ts
// Text-to-video generation for Tier-2 stretch.
// Supports Runway / Luma / Pika / Veo via env-selected provider.
// Always falls back to a pre-baked clip at /clips/tier2-fallback.mp4 so the
// demo never breaks.

import type { RenderRequest, RenderResult } from "@/lib/types";

const PROVIDER = (process.env.VIDEO_PROVIDER || "fallback").toLowerCase();
const FALLBACK_CLIP = "/clips/tier2-fallback.mp4";

export async function generate(req: RenderRequest): Promise<RenderResult> {
  const disclosure = `Sponsored · ${req.brand}`;

  if (PROVIDER === "fallback") {
    return { asset_url: FALLBACK_CLIP, tier: 2, disclosure };
  }

  try {
    const asset_url = await callProvider(PROVIDER, req);
    return { asset_url: asset_url || FALLBACK_CLIP, tier: 2, disclosure };
  } catch (err) {
    console.warn(`[render-video:${PROVIDER}] failed, using fallback`, err);
    return { asset_url: FALLBACK_CLIP, tier: 2, disclosure };
  }
}

async function callProvider(provider: string, req: RenderRequest): Promise<string | null> {
  switch (provider) {
    case "runway":  return callRunway(req);
    case "luma":    return callLuma(req);
    case "pika":    return callPika(req);
    case "veo":     return callVeo(req);
    default:        return null;
  }
}

// Each provider wrapper is a minimal stub — fill in once the chosen key
// is in .env.local. They all return a hosted asset URL or null.

async function callRunway(req: RenderRequest): Promise<string | null> {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) return null;
  // TODO: real Runway Gen-3 call with req.brand + slot label as prompt.
  // Keeping as stub to avoid blocking the demo on async polling logic.
  return null;
}

async function callLuma(req: RenderRequest): Promise<string | null> {
  const key = process.env.LUMA_API_KEY;
  if (!key) return null;
  // TODO: real Luma Dream Machine call.
  return null;
}

async function callPika(req: RenderRequest): Promise<string | null> {
  const key = process.env.PIKA_API_KEY;
  if (!key) return null;
  // TODO: real Pika call.
  return null;
}

async function callVeo(req: RenderRequest): Promise<string | null> {
  const key = process.env.VEO_API_KEY;
  if (!key) return null;
  // TODO: real Veo (Google AI Studio) call.
  return null;
}
