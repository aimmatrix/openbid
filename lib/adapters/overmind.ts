// lib/adapters/overmind.ts
// Agent supervision + LLM tracing via Overmind.
//
// Why we don't use @overmind-lab/trace-sdk's OvermindClient directly:
//   v0.0.6 hardcodes the wrong ingest path (/api/v1/traces/create — 404)
//   and the wrong auth header (X-API-TOKEN — 401). The real ingest endpoint,
//   per docs.overmindlab.ai/guides/integrations/, is:
//     POST {OVERMIND_TRACES_URL}/api/v1/traces
//     Header: X-Api-Key: ovr_...
//     Content-Type: application/x-protobuf  (OTLP proto)
// So we wire OpenTelemetry directly with that URL/header and borrow the
// SDK's OpenAIInstrumentation for auto-tracing of openai.chat.completions
// calls. When the SDK fixes its bug we can simplify back to OvermindClient.
//
// What this module does:
//   1. At module load (if OVERMIND_API_KEY is set), set up an OTel NodeSDK
//      with a SimpleSpanProcessor → OTLP proto exporter → Overmind.
//   2. Monkey-patch the OpenAI prototype via OpenAIInstrumentation so any
//      openai.chat.completions.create / openai.completions.create call lands
//      as a span automatically. lib/adapters/llm.ts imports this module
//      first, so the patch happens before any client is constructed.
//   3. Expose trace(entry) — supervisor's audit events become tiny OTel
//      spans tagged with our domain attributes, sitting alongside the LLM
//      spans in the Overmind Traces view.
//   4. Keep a local in-memory audit buffer per scene_id so the UI can read
//      audit_log immediately without round-tripping Overmind.
//
// Server-only: pulls in @opentelemetry/sdk-node. Only import from route
// handlers, server components, or other server modules.

import OpenAI from "openai";
import { trace as otelTrace, SpanStatusCode } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { OpenAIInstrumentation } from "@overmind-lab/trace-sdk";

import type { AuditEntry } from "@/lib/types";

const OVERMIND_KEY = process.env.OVERMIND_API_KEY;
const OVERMIND_TRACES_URL =
  process.env.OVERMIND_TRACES_URL || "https://api.overmindlab.ai";
const APP_NAME = "openbid";

// ---------------------------------------------------------------------------
// One-time init. Side-effect at module load so the OpenAI prototype is patched
// before any client is constructed downstream (e.g. lib/adapters/llm.ts).
// ---------------------------------------------------------------------------

let sdk: NodeSDK | null = null;
let initialized = false;

if (OVERMIND_KEY) {
  try {
    const exporter = new OTLPTraceExporter({
      url: `${OVERMIND_TRACES_URL}/api/v1/traces`,
      headers: { "X-Api-Key": OVERMIND_KEY },
    });

    // false = SimpleSpanProcessor: spans export immediately. Right for the
    // hackathon demo so judges see traces appear in real time.
    const processor = new SimpleSpanProcessor(exporter);

    // Auto-instrument OpenAI by patching its Chat.Completions prototype.
    const openaiInstrumentation = new OpenAIInstrumentation({ enabled: true });
    openaiInstrumentation.manuallyInstrument(OpenAI);

    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: APP_NAME,
        [ATTR_SERVICE_VERSION]: "0.1.0",
        "deployment.environment":
          process.env.DEPLOYMENT_ENVIRONMENT || "development",
        "overmind.app.name": APP_NAME,
      }),
      spanProcessors: [processor],
      instrumentations: [openaiInstrumentation],
    });

    sdk.start();
    initialized = true;
    // eslint-disable-next-line no-console
    console.log("[overmind] tracing initialised, app=openbid");
  } catch (err) {
    sdk = null;
    initialized = false;
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
 * Emit an audit event. Goes to the local buffer and (if configured) Overmind
 * as a one-shot OTel span tagged with our domain attributes.
 *
 * "blocked" actions are marked with span status=ERROR so they're filterable
 * via Overmind's "Errors" quick filter — the safety-block moment shows up
 * as a red dot in the dashboard.
 */
export async function trace(entry: AuditEntry & { scene_id?: string }): Promise<void> {
  const { scene_id, ...auditEntry } = entry;
  const key = bufferKey(scene_id);
  appendLocal(key, auditEntry);

  if (!initialized) return;

  try {
    // Give blocked/promote spans a tiny positive duration so backends that
    // reject zero-duration spans still accept them.
    const startTime = auditEntry.ts;
    const endTime = auditEntry.ts + 1;

    const span = tracer.startSpan(`oversight.${auditEntry.action}`, {
      startTime,
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
    span.end(endTime);
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
 * Flush any in-flight spans and shut the SDK down. With SimpleSpanProcessor
 * this mostly just waits for in-flight exports to complete. Call from
 * short-lived scripts (e.g. the smoke test) or on process exit — NOT per
 * request, because shutdown can't be re-started.
 */
export async function flushOvermind(): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.shutdown();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[overmind] flush failed", err);
  }
}

/** Sanity check used by smoke tests / status panels. */
export function overmindStatus(): { enabled: boolean; appName: string | null } {
  return {
    enabled: initialized,
    appName: initialized ? APP_NAME : null,
  };
}
