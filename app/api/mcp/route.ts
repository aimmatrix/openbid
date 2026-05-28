// app/api/mcp/route.ts
// MCP-compatible JSON-RPC endpoint exposing OpenBid auction/agent tools.
// Judges trace repo → /api/mcp; Alpic deploys this when ALPIC_TOKEN is set.

import { NextResponse } from "next/server";
import { getScene } from "@/lib/scene/analyzer";
import { runAgents } from "@/lib/agents/advertiser";
import { runAuction } from "@/lib/auction/engine";
import { supervise } from "@/lib/oversight/supervisor";
import { render } from "@/lib/render";
import { getCampaigns, reportPlacement } from "@/lib/adapters/thrad";
import {
  MCP_TOOLS,
  coerceBids,
  registerAuctionTool,
  type McpToolCallResult,
  type McpToolName,
} from "@/lib/adapters/alpic";

export const runtime = "nodejs";

// Fire-and-forget Alpic registration on cold start (no-op without token).
void registerAuctionTool();

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function rpcOk(id: JsonRpcRequest["id"], result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcErr(id: JsonRpcRequest["id"], code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

export async function GET() {
  return NextResponse.json({
    name: "openbid-mcp",
    version: "0.1.0",
    protocol: "mcp-jsonrpc",
    endpoint: "/api/mcp",
    tools: MCP_TOOLS.map((t) => t.name),
  });
}

export async function POST(req: Request) {
  let body: JsonRpcRequest;
  try {
    body = (await req.json()) as JsonRpcRequest;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { id, method, params = {} } = body;

  try {
    switch (method) {
      case "initialize":
        return rpcOk(id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "openbid-mcp", version: "0.1.0" },
          capabilities: { tools: {} },
        });

      case "tools/list":
        return rpcOk(id, { tools: MCP_TOOLS });

      case "tools/call": {
        const name = String(params.name ?? "") as McpToolName;
        const args = (params.arguments ?? {}) as Record<string, unknown>;
        const result = await handleToolCall(name, args);
        return rpcOk(id, result);
      }

      default:
        return rpcErr(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return rpcOk(id, {
      content: [{ type: "text", text: message }],
      isError: true,
    } satisfies McpToolCallResult);
  }
}

async function handleToolCall(name: McpToolName, args: Record<string, unknown>): Promise<McpToolCallResult> {
  switch (name) {
    case "list_campaigns": {
      const campaigns = await getCampaigns();
      return { content: [{ type: "text", text: JSON.stringify(campaigns, null, 2) }] };
    }

    case "run_auction": {
      const scene_id = String(args.scene_id ?? "");
      const bids = coerceBids(args.bids);
      const result = runAuction(scene_id, bids);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    case "run_pipeline": {
      const scene_id = String(args.scene_id ?? "");
      const tier = args.tier === 2 ? 2 : 1;

      const scene = getScene(scene_id);
      const campaigns = await getCampaigns();
      const bids = await runAgents(scene, campaigns);
      const auction = runAuction(scene.scene_id, bids);
      const oversight = await supervise(scene, auction, campaigns);
      const finalSlot =
        scene.slots.find((s) => s.slot_id === oversight.final_winner.target_slot) ?? scene.slots[0];
      const renderResult = await render({
        scene_id: scene.scene_id,
        slot: finalSlot,
        brand: oversight.final_winner.brand,
        tier,
      });
      await reportPlacement(auction);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ scene, bids, auction, oversight, render: renderResult }, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
