// lib/adapters/overmind.ts
// Agent supervision + LLM tracing via the Overmind tracing SDK.
//
// What happens here:
//   1. At module load, we construct an OvermindClient and call initTracing.
//      This monkey-patches OpenAI's prototype so every chat.completions.create
//      call lands in Overmind as an `openai.chat` span automatically.
//   2. supervise() in lib/oversight emits business-level audit entries
//      (research/bid/win/blocked/approved/promote). Each one becomes a tiny
//      OTel span here so the auction lifecycle shows up in the Overmind
//      Traces view alongside the LLM calls.
//   3. We ALSO keep a local in-memory buffer keyed by scene_id so the UI
//      can render audit_log immediately without round-tripping Overmind.
//
// If OVERMIND_API_KEY is missing, we silently fall back to the local buffer
// only — the demo still works.
//
// Server-only: this pulls in @opentelemetry/sdk-node. Only ever import it
// from route handlers, server components, or other server modules.

import { OvermindClient } from "@overmind-lab/trace-sdk";
import { trace as otelTrace, SpanStatusCode } from "@opentelemetry/api";
import OpenAI from "openai";

import type { AuditEntry } from "@/lib/types";

const OVERMIND_KEY = process.env.OVERMIND_API_KEY;

// ---------------------------------------------------------------------------
// One-time init. Done at module load so OpenAI's prototype is patched BEFORE
// anyone imports & constructs the OpenAI client (e.g. lib/adapters/llm.ts).
// ---------------------------------------------------------------------------

let overmindClient: OvermindClient | null = null;

if (OVERMIND_KEY) {
  try {
    overmindClient = new OvermindClient({
      apiKey: OVERMIND_KEY,
      appName: "openbid",
    });
    overmindClient.initTracing({
      // false = SimpleSpanProcessor: spans export immediately. Right for the
      // hackathon demo (judges see traces in real time).
      enableBatching: false,
      enabledProviders: { openai: OpenAI },
      instrumentations: [],
    });
    // eslint-disable-next-line no-console
    console.log("[overmind] tracing initialised, app=openbid");
  } catch (err) {
    overmindClient = null;
    // eslint-disable-next-line no-console
    console.warn("[overmind] init failed, falling back to local buffer", err);
  }
}

const tracer = otelTrace.getTracer("openbid.oversight", "0.1.0");

// ---------------------------------------------------------------------------
// Local audit-log buffer, keyed by scene_id. Always kept in sync with what we
// send to Overmind so the UI can read audit_log straight from memory.
// ---------------------------------------------------------------------------

const localBuffer = new Map<string, AuditEntry[]>();

function bufferKey(scene_id?: string): string {
  return scene_id ?? "global";
}

function appendLocal(key: string, entry: AuditEntry): void {
  const existing = localBuffer.get(key) ?? [];
  existing.push(entry);
  localBuffer.set(key, existing);
}

// ---------------------------------------------------------------------------
// Public API — same shape as before so lib/oversight/supervisor doesn't care
// whether we're hitting real Overmind or local-only.
// ---------------------------------------------------------------------------

/**
 * Emit an audit event. Goes to both the local buffer and (if configured)
 * Overmind as a one-shot OTel span tagged with our domain attributes.
 */
export async function trace(entry: AuditEntry & { scene_id?: string }): Promise<void> {
  const { scene_id, ...auditEntry } = entry;
  const key = bufferKey(scene_id);
  appendLocal(key, auditEntry);

  if (!overmindClient) return;

  try {
    const span = tracer.startSpan(`oversight.${auditEntry.action}`, {
      startTime: auditEntry.ts,
      attributes: {
        "openbid.scene_id": key,
        "openbid.agent_id": auditEntry.agent_id,
        "openbid.action": auditEntry.action,
        "openbid.detail": auditEntry.detail,
        "openbid.ts": auditEntry.ts,
      },
    });
    if (auditEntry.action === "blocked") {
      span.setStatus({ code: SpanStatusCode.ERROR, message: auditEntry.detail });
    }
    span.end(auditEntry.ts);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[overmind] trace span failed, kept locally", err);
  }
}

/**
 * Read back the audit log for a scene. Reads from the local buffer only —
 * Overmind's Traces view is the cross-run history; this is for the live UI.
 */
export async function fetchAuditLog(scene_id: string): Promise<AuditEntry[]> {
  const local = localBuffer.get(scene_id) ?? [];
  return [...local].sort((a, b) => a.ts - b.ts);
}

/** Drain local buffer for a scene (used at end of /api/run cycle). */
export function drainLocalBuffer(scene_id: string): AuditEntry[] {
  const entries = localBuffer.get(scene_id) ?? [];
  localBuffer.delete(scene_id);
  return entries;
}

/**
 * Flush any in-flight spans. Call at the end of a request handler — with
 * enableBatching:false this is mostly a no-op, but it's the right hook to
 * keep around for when we switch to batched export in production.
 */
export async function flushOvermind(): Promise<void> {
  if (!overmindClient) return;
  try {
    await overmindClient.shutdown();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[overmind] flush failed", err);
  }
}

/** Sanity check used by smoke tests / status panels. */
export function overmindStatus(): { enabled: boolean; appName: string | null } {
  return {
    enabled: overmindClient !== null,
    appName: overmindClient?.appName ?? null,
  };
}
