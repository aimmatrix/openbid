// lib/adapters/alpic.ts
// Pointer to the Skybridge MCP server we deploy to Alpic. The actual MCP
// server lives in mcp/ — Skybridge framework, deployed with `cd mcp && npm
// run deploy`. This adapter:
//
//   1. Exposes the live deployment URL (set in .env.local as
//      ALPIC_ENDPOINT_URL) so the UI can link judges straight to the
//      hosted MCP and its playground.
//   2. Keeps the tool catalogue + MCP-JSON-RPC scaffolding the local
//      app/api/mcp route uses as a fallback when the Skybridge deploy
//      isn't reachable.
//
// We deliberately do NOT try to "deploy" from this Node process — Alpic
// deployment is a CLI flow (`npx alpic deploy`), not a runtime API call.

import type { Bid } from "@/lib/types";

const ALPIC_ENDPOINT = process.env.ALPIC_ENDPOINT_URL;
const ALPIC_PLAYGROUND = process.env.ALPIC_PLAYGROUND_URL;

export const ALPIC_ENABLED = !!ALPIC_ENDPOINT;

/** Live MCP endpoint judges can call (the Skybridge deploy). */
export function alpicEndpointUrl(): string | null {
  return ALPIC_ENDPOINT ?? null;
}

/** Human-friendly playground UI hosted by Alpic. */
export function alpicPlaygroundUrl(): string | null {
  if (ALPIC_PLAYGROUND) return ALPIC_PLAYGROUND;
  if (ALPIC_ENDPOINT) return `${ALPIC_ENDPOINT.replace(/\/$/, "")}/try`;
  return null;
}

/** MCP-spec JSON-RPC URL (Streamable HTTP transport lives at /mcp). */
export function alpicMcpUrl(): string | null {
  if (!ALPIC_ENDPOINT) return null;
  return `${ALPIC_ENDPOINT.replace(/\/$/, "")}/mcp`;
}

/**
 * Tool catalogue for the LOCAL /api/mcp fallback route. The Skybridge server
 * in mcp/ exposes its own (overlapping but distinct) catalogue: list_campaigns,
 * list_scenes, simulate_auction. These three are the local-only ones that
 * need the parent app's secrets (LLM, Tavily, Overmind) to run.
 */
export const MCP_TOOLS = [
  {
    name: "list_campaigns",
    description:
      "Return active OpenBid advertiser campaigns (brands, budgets, guardrails).",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "run_auction",
    description:
      "Run a second-price (Vickrey) auction over caller-supplied bids for a scene.",
    inputSchema: {
      type: "object",
      properties: {
        scene_id: { type: "string" },
        bids: {
          type: "array",
          description: "Bid[] conforming to lib/types.ts",
          items: { type: "object" },
        },
      },
      required: ["scene_id", "bids"],
      additionalProperties: false,
    },
  },
  {
    name: "run_pipeline",
    description:
      "End-to-end OpenBid run: scene → agents → auction → oversight → render. Needs LLM/Tavily/Overmind keys.",
    inputSchema: {
      type: "object",
      properties: {
        scene_id: { type: "string" },
        tier: {
          type: "integer",
          enum: [1, 2],
          description: "1 = composite overlay, 2 = AI-generated video",
        },
      },
      required: ["scene_id"],
      additionalProperties: false,
    },
  },
] as const;

export type McpToolName = (typeof MCP_TOOLS)[number]["name"];

export interface McpToolCallResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/** Validate bid shape loosely before passing to runAuction. */
export function coerceBids(raw: unknown): Bid[] {
  if (!Array.isArray(raw)) throw new Error("bids must be an array");
  return raw.map((item, i) => {
    const b = item as Record<string, unknown>;
    if (typeof b.agent_id !== "string" || typeof b.brand !== "string") {
      throw new Error(`bids[${i}] missing agent_id or brand`);
    }
    if (typeof b.bid !== "number" || typeof b.target_slot !== "string") {
      throw new Error(`bids[${i}] missing bid or target_slot`);
    }
    return {
      agent_id: b.agent_id,
      brand: b.brand,
      bid: b.bid,
      reasoning: String(b.reasoning ?? ""),
      target_slot: b.target_slot,
      research_snippets: Array.isArray(b.research_snippets)
        ? b.research_snippets.map(String)
        : undefined,
    };
  });
}

/**
 * Surface the live deployment so a startup log or status panel can link to it.
 * No-op if ALPIC_ENDPOINT_URL isn't set.
 */
export async function registerAuctionTool(): Promise<void> {
  if (!ALPIC_ENABLED) return;
  // eslint-disable-next-line no-console
  console.log("[alpic] live MCP at", alpicMcpUrl(), "— playground:", alpicPlaygroundUrl());
}
