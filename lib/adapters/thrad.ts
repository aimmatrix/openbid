// lib/adapters/thrad.ts
// Campaign data from Thrad. Falls back to local fixtures if THRAD_API_KEY
// is absent — same shape, so downstream code is identical.

import type { Campaign, AuctionResult } from "@/lib/types";
import { campaigns as fixtureCampaigns } from "@/mocks/campaigns";

const THRAD_KEY = process.env.THRAD_API_KEY;
const THRAD_BASE = process.env.THRAD_BASE_URL || "https://api.thrad.com";

export async function getCampaigns(): Promise<Campaign[]> {
  if (!THRAD_KEY) return fixtureCampaigns;

  try {
    const res = await fetch(`${THRAD_BASE}/campaigns`, {
      headers: { Authorization: `Bearer ${THRAD_KEY}` },
    });
    if (!res.ok) return fixtureCampaigns;
    const data = await res.json();
    // Trust the Thrad shape if present, else fall back.
    return Array.isArray(data?.campaigns) ? data.campaigns : fixtureCampaigns;
  } catch {
    return fixtureCampaigns;
  }
}

export async function reportPlacement(result: AuctionResult): Promise<void> {
  if (!THRAD_KEY) {
    console.log("[thrad:local] placement reported", result.scene_id, result.winner.brand, result.price);
    return;
  }

  try {
    await fetch(`${THRAD_BASE}/placements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${THRAD_KEY}`,
      },
      body: JSON.stringify({
        scene_id: result.scene_id,
        brand: result.winner.brand,
        price_cpm: result.price,
        ts: Date.now(),
      }),
    });
  } catch (err) {
    console.warn("[thrad] placement report failed, continuing", err);
  }
}
