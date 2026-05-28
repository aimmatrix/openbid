// lib/adapters/alpic.ts
// Optional bonus: expose auction/agent tools as an MCP endpoint via Alpic.
// Local MCP handler lives at POST /api/mcp; Alpic deploys it when ALPIC_TOKEN
// is present. Without a token, registerAuctionTool() is a no-op.

import type { Bid } from "@/lib/types";

const ALPIC_TOKEN = process.env.ALPIC_TOKEN;
const ALPIC_BASE = process.env.ALPIC_BASE_URL || "https://api.alpic.ai";
const ALPIC_ENVIRONMENT_ID = process.env.ALPIC_ENVIRONMENT_ID;

export const ALPIC_ENABLED = !!ALPIC_TOKEN;

export function alpicEndpointUrl(): string | null {
  return process.env.ALPIC_ENDPOINT_URL || null;
}

/** Tool definitions exposed by /api/mcp for judges + Alpic registry. */
export const MCP_TOOLS = [
  {
    name: "list_campaigns",
    description: "Return active advertiser campaigns (brands, budgets, guardrails).",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "run_auction",
    description: "Run a second-price (Vickrey) auction over submitted bids for a scene.",
    inputSchema: {
      type: "object",
      properties: {
        scene_id: { type: "string", description: "Scene identifier, e.g. scene_park_afternoon" },
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
    description: "End-to-end OpenBid run: scene → agents → auction → oversight → render.",
    inputSchema: {
      type: "object",
      properties: {
        scene_id: { type: "string" },
        tier: { type: "integer", enum: [1, 2], description: "1 = composite, 2 = AI video" },
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
 * Register / redeploy the MCP endpoint on Alpic when credentials are present.
 * Safe to call at startup — no-ops without ALPIC_TOKEN.
 */
export async function registerAuctionTool(): Promise<void> {
  if (!ALPIC_TOKEN) return;

  const localMcp = alpicEndpointUrl() ?? inferLocalMcpUrl();

  try {
    if (ALPIC_ENVIRONMENT_ID) {
      const res = await fetch(`${ALPIC_BASE}/v1/environments/${ALPIC_ENVIRONMENT_ID}/deploy`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ALPIC_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "openbid-mcp", endpoint: localMcp }),
      });
      if (!res.ok) {
        console.warn("[alpic] deploy failed", res.status, await res.text());
      } else {
        console.log("[alpic] MCP endpoint deployed", localMcp);
      }
      return;
    }

    // No environment id — log readiness so judges can trace repo → endpoint.
    console.log("[alpic] MCP tools ready at", localMcp, "— set ALPIC_ENVIRONMENT_ID to auto-deploy");
  } catch (err) {
    console.warn("[alpic] registration failed, continuing locally", err);
  }
}

function inferLocalMcpUrl(): string {
  const host = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${host.replace(/\/$/, "")}/api/mcp`;
}
