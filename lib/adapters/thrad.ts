// lib/adapters/thrad.ts
// Campaign data from Thrad. Falls back to local fixtures if THRAD_API_KEY
// is absent — same shape, so downstream code is identical.

import type { Campaign, AuctionResult } from "@/lib/types";
import { campaigns as fixtureCampaigns } from "@/mocks/campaigns";

const THRAD_KEY = process.env.THRAD_API_KEY;
const THRAD_BASE = (process.env.THRAD_BASE_URL || "https://api.thrad.com").replace(/\/$/, "");

function normalizeCampaign(raw: unknown): Campaign | null {
  const c = raw as Record<string, unknown>;
  if (typeof c.agent_id !== "string" || typeof c.brand !== "string") return null;
  if (typeof c.category !== "string") return null;
  if (typeof c.budget !== "number" || typeof c.max_bid !== "number") return null;
  return {
    agent_id: c.agent_id,
    brand: c.brand,
    category: c.category,
    budget: c.budget,
    max_bid: c.max_bid,
    guardrails: Array.isArray(c.guardrails) ? c.guardrails.map(String) : [],
  };
}

function normalizeCampaigns(raw: unknown): Campaign[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { campaigns?: unknown })?.campaigns)
      ? (raw as { campaigns: unknown[] }).campaigns
      : [];
  const normalized = list.map(normalizeCampaign).filter((c): c is Campaign => c !== null);
  return normalized.length > 0 ? normalized : fixtureCampaigns;
}

export async function getCampaigns(): Promise<Campaign[]> {
  if (!THRAD_KEY) return fixtureCampaigns;

  try {
    const res = await fetch(`${THRAD_BASE}/campaigns`, {
      headers: {
        Authorization: `Bearer ${THRAD_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      console.warn("[thrad] getCampaigns failed", res.status);
      return fixtureCampaigns;
    }
    const data = await res.json();
    return normalizeCampaigns(data);
  } catch (err) {
    console.warn("[thrad] getCampaigns error, using fixtures", err);
    return fixtureCampaigns;
  }
}

export async function reportPlacement(result: AuctionResult): Promise<void> {
  if (!THRAD_KEY) {
    console.log(
      "[thrad:local] placement reported",
      result.scene_id,
      result.winner.brand,
      `£${result.price.toFixed(2)} CPM`,
    );
    return;
  }

  try {
    const res = await fetch(`${THRAD_BASE}/placements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${THRAD_KEY}`,
      },
      body: JSON.stringify({
        scene_id: result.scene_id,
        brand: result.winner.brand,
        agent_id: result.winner.agent_id,
        target_slot: result.winner.target_slot,
        price_cpm: result.price,
        ts: Date.now(),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      console.warn("[thrad] placement report rejected", res.status);
    }
  } catch (err) {
    console.warn("[thrad] placement report failed, continuing", err);
  }
}
