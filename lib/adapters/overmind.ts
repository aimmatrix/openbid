// lib/adapters/overmind.ts
// Agent supervision/tracing. Highest-value bonus prize.
// If OVERMIND_API_KEY is set, traces go to Overmind. Otherwise we hold them in
// an in-memory buffer keyed by scene_id so the local fallback behaves identically
// from the caller's perspective.

import type { AuditEntry } from "@/lib/types";

const OVERMIND_KEY = process.env.OVERMIND_API_KEY;
const OVERMIND_BASE = process.env.OVERMIND_BASE_URL || "https://api.overmind.ai";

const localBuffer = new Map<string, AuditEntry[]>();

export async function trace(entry: AuditEntry & { scene_id?: string }): Promise<void> {
  const key = entry.scene_id ?? "global";
  const existing = localBuffer.get(key) ?? [];
  existing.push(entry);
  localBuffer.set(key, existing);

  if (!OVERMIND_KEY) return;

  try {
    await fetch(`${OVERMIND_BASE}/traces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OVERMIND_KEY}`,
      },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.warn("[overmind] trace post failed, kept locally", err);
  }
}

export async function fetchAuditLog(scene_id: string): Promise<AuditEntry[]> {
  if (!OVERMIND_KEY) return localBuffer.get(scene_id) ?? [];

  try {
    const res = await fetch(`${OVERMIND_BASE}/traces?scene_id=${encodeURIComponent(scene_id)}`, {
      headers: { Authorization: `Bearer ${OVERMIND_KEY}` },
    });
    if (!res.ok) return localBuffer.get(scene_id) ?? [];
    const data = await res.json();
    return Array.isArray(data?.entries) ? data.entries : (localBuffer.get(scene_id) ?? []);
  } catch {
    return localBuffer.get(scene_id) ?? [];
  }
}

// Optional helper: drain (used at end of a /api/run cycle).
export function drainLocalBuffer(scene_id: string): AuditEntry[] {
  const entries = localBuffer.get(scene_id) ?? [];
  localBuffer.delete(scene_id);
  return entries;
}
