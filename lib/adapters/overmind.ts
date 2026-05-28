// lib/adapters/overmind.ts
// Agent supervision/tracing. Highest-value bonus prize.
// If OVERMIND_API_KEY is set, traces go to Overmind. Otherwise we hold them in
// an in-memory buffer keyed by scene_id so the local fallback behaves identically
// from the caller's perspective.

import type { AuditEntry } from "@/lib/types";

const OVERMIND_KEY = process.env.OVERMIND_API_KEY;
const OVERMIND_BASE = process.env.OVERMIND_BASE_URL || "https://api.overmind.ai";

const localBuffer = new Map<string, AuditEntry[]>();

function bufferKey(scene_id?: string): string {
  return scene_id ?? "global";
}

function appendLocal(key: string, entry: AuditEntry): void {
  const existing = localBuffer.get(key) ?? [];
  existing.push(entry);
  localBuffer.set(key, existing);
}

export async function trace(entry: AuditEntry & { scene_id?: string }): Promise<void> {
  const { scene_id, ...auditEntry } = entry;
  const key = bufferKey(scene_id);
  appendLocal(key, auditEntry);

  if (!OVERMIND_KEY) return;

  try {
    const res = await fetch(`${OVERMIND_BASE}/traces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OVERMIND_KEY}`,
      },
      body: JSON.stringify({ ...auditEntry, scene_id: key }),
    });
    if (!res.ok) {
      console.warn(`[overmind] trace post returned ${res.status}, kept locally`);
    }
  } catch (err) {
    console.warn("[overmind] trace post failed, kept locally", err);
  }
}

export async function fetchAuditLog(scene_id: string): Promise<AuditEntry[]> {
  const local = localBuffer.get(scene_id) ?? [];

  if (!OVERMIND_KEY) {
    return [...local].sort((a, b) => a.ts - b.ts);
  }

  try {
    const res = await fetch(
      `${OVERMIND_BASE}/traces?scene_id=${encodeURIComponent(scene_id)}`,
      { headers: { Authorization: `Bearer ${OVERMIND_KEY}` } },
    );
    if (!res.ok) return [...local].sort((a, b) => a.ts - b.ts);
    const data = (await res.json()) as { entries?: AuditEntry[] };
    const remote = Array.isArray(data?.entries) ? data.entries : [];
    // Merge remote + local so nothing is lost if Overmind lags behind.
    const merged = [...local, ...remote].sort((a, b) => a.ts - b.ts);
    return merged;
  } catch {
    return [...local].sort((a, b) => a.ts - b.ts);
  }
}

/** Optional helper: drain (used at end of a /api/run cycle). */
export function drainLocalBuffer(scene_id: string): AuditEntry[] {
  const entries = localBuffer.get(scene_id) ?? [];
  localBuffer.delete(scene_id);
  return entries;
}
