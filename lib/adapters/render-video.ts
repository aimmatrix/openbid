// lib/adapters/render-video.ts
// Text-to-video generation for Tier-2 stretch.
// Supports Runway / Luma / Pika / Veo via VIDEO_PROVIDER env.
// Luma is fully implemented; others return null until keys are wired.
// Always falls back to /clips/tier2-fallback.mp4 so the demo never breaks.

import type { RenderRequest, RenderResult } from "@/lib/types";

const PROVIDER = (process.env.VIDEO_PROVIDER || "fallback").toLowerCase();
const FALLBACK_CLIP = "/clips/tier2-fallback.mp4"; // coffee / default winner
const APPAREL_CLIP = "/clips/tier2-apparel.mp4";

// Pick a pre-baked Tier-2 clip that matches the winning brand, so a live demo
// is coherent on either scene: coffee on the kitchen path, apparel on the park
// path (where the alcohol bid is blocked and an apparel brand is promoted).
function fallbackClipFor(brand: string): string {
  return /apparel|kindle|fashion|wear|clothing/i.test(brand) ? APPAREL_CLIP : FALLBACK_CLIP;
}
const LUMA_BASE = "https://api.lumalabs.ai/dream-machine/v1";
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 120_000;

export async function generate(req: RenderRequest): Promise<RenderResult> {
  const disclosure = `Sponsored · ${req.brand}`;

  if (PROVIDER === "fallback") {
    return { asset_url: fallbackClipFor(req.brand), tier: 2, disclosure };
  }

  try {
    const asset_url = await callProvider(PROVIDER, req);
    return { asset_url: asset_url || fallbackClipFor(req.brand), tier: 2, disclosure };
  } catch (err) {
    console.warn(`[render-video:${PROVIDER}] failed, using fallback`, err);
    return { asset_url: fallbackClipFor(req.brand), tier: 2, disclosure };
  }
}

function buildPrompt(req: RenderRequest): string {
  return (
    `Short product-placement video ad for ${req.brand}. ` +
    `Place the brand naturally in: ${req.slot.label}. ` +
    `Cinematic, photorealistic, 5 seconds, subtle branded integration.`
  );
}

async function callProvider(provider: string, req: RenderRequest): Promise<string | null> {
  switch (provider) {
    case "runway":
      return callRunway(req);
    case "luma":
      return callLuma(req);
    case "pika":
      return callPika(req);
    case "veo":
      return callVeo(req);
    default:
      return null;
  }
}

async function pollUntilVideo(
  statusUrl: string,
  headers: Record<string, string>,
  extractVideo: (json: Record<string, unknown>) => string | null,
): Promise<string | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(statusUrl, { headers });
    if (!res.ok) return null;

    const json = (await res.json()) as Record<string, unknown>;
    const state = String(json.state ?? json.status ?? "").toLowerCase();

    if (state === "completed" || state === "succeeded") {
      return extractVideo(json);
    }
    if (state === "failed" || state === "error") {
      console.warn("[render-video] generation failed", json.failure_reason ?? json.error);
      return null;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  console.warn("[render-video] generation timed out");
  return null;
}

async function callLuma(req: RenderRequest): Promise<string | null> {
  const key = process.env.LUMA_API_KEY;
  if (!key) return null;

  const headers = {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const createRes = await fetch(`${LUMA_BASE}/generations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: buildPrompt(req),
      model: "ray-2",
      resolution: "720p",
      duration: "5s",
      aspect_ratio: "16:9",
    }),
  });

  if (!createRes.ok) {
    console.warn("[render-video:luma] create failed", createRes.status, await createRes.text());
    return null;
  }

  const created = (await createRes.json()) as { id?: string };
  if (!created.id) return null;

  return pollUntilVideo(`${LUMA_BASE}/generations/${created.id}`, headers, (json) => {
    const assets = json.assets as { video?: string } | undefined;
    return assets?.video ?? null;
  });
}

async function callRunway(req: RenderRequest): Promise<string | null> {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) return null;

  const headers = {
    Authorization: `Bearer ${key}`,
    "X-Runway-Version": "2024-11-06",
    "Content-Type": "application/json",
  };

  const createRes = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "gen3a_turbo",
      promptText: buildPrompt(req),
      duration: 5,
      ratio: "1280:720",
    }),
  });

  if (!createRes.ok) {
    console.warn("[render-video:runway] create failed", createRes.status);
    return null;
  }

  const created = (await createRes.json()) as { id?: string };
  if (!created.id) return null;

  return pollUntilVideo(`https://api.dev.runwayml.com/v1/tasks/${created.id}`, headers, (json) => {
    const output = json.output as string[] | undefined;
    return output?.[0] ?? null;
  });
}

async function callPika(req: RenderRequest): Promise<string | null> {
  const key = process.env.PIKA_API_KEY;
  if (!key) return null;
  // Pika API shape varies by plan — stub returns null until event keys arrive.
  void req;
  void key;
  return null;
}

async function callVeo(req: RenderRequest): Promise<string | null> {
  const key = process.env.VEO_API_KEY;
  if (!key) return null;
  // Google Veo via AI Studio — stub returns null until event keys arrive.
  void req;
  void key;
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
