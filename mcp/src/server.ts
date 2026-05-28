// mcp/src/server.ts
// OpenBid MCP server — exposes the auction layer of the OpenBid platform as
// MCP tools so judges (and any other MCP client) can call into the auction
// and watch the brand-safety gate fire in real time.
//
// Three tools, each one designed to land cleanly in Claude / ChatGPT chat:
//   list_campaigns    — who's bidding and what they're allowed to do
//   list_scenes       — available inventory + safety flags
//   simulate_auction  — run a full auction + safety check for one scene
//
// We deliberately keep this server self-contained: no LLM keys, no external
// HTTP calls. The parent Next.js app (lib/agents/advertiser.ts) does the
// LLM-driven bidding; here we run fixture bids so the deployed MCP works
// from a cold start without secrets. The auction + safety logic is the
// same — same auction engine, same rules — so the verdict matches the
// live demo.

import { McpServer } from "skybridge/server";
import { z } from "zod";

import { campaigns } from "./openbid/campaigns.js";
import { scenes, getSceneById } from "./openbid/scenes.js";
import { sampleBidsFor } from "./openbid/bids.js";
import { runAuction } from "./openbid/auction.js";
import { supervise } from "./openbid/oversight.js";
import type { SimulationResult } from "./openbid/types.js";

const SimulateInput = {
  scene_id: z
    .string()
    .describe(
      "OpenBid scene identifier. Use list_scenes to discover valid values (e.g. scene_kitchen_morning, scene_park_afternoon).",
    ),
};

function summariseSimulation(result: SimulationResult): string {
  const { scene, auction, oversight } = result;
  const lines: string[] = [];
  lines.push(`Scene: ${scene.scene_id} — ${scene.context}`);
  if (scene.flags.length > 0) {
    lines.push(`Safety flags: ${scene.flags.join(", ")}`);
  }
  lines.push("");
  lines.push(
    `Auction winner: ${auction.winner.brand} at £${auction.winner.bid.toFixed(2)} CPM`,
  );
  lines.push(
    `Clearing price (second-price): £${auction.price.toFixed(2)} CPM`,
  );
  lines.push("");
  lines.push(`Ranked bids:`);
  for (const b of auction.ranked_bids) {
    lines.push(
      `  ${b.rank}. ${b.brand} £${b.bid.toFixed(2)} → slot ${b.target_slot}`,
    );
  }
  lines.push("");
  if (oversight.decision === "blocked") {
    lines.push(
      `🚫 OVERSIGHT BLOCKED — rule ${oversight.triggered_rule}: ${oversight.reason}`,
    );
    if (oversight.final_winner.agent_id !== auction.winner.agent_id) {
      lines.push(
        `   Runner-up promoted: ${oversight.final_winner.brand} (£${oversight.final_winner.bid.toFixed(2)})`,
      );
    } else {
      lines.push(`   No eligible runner-up — placement skipped.`);
    }
  } else {
    lines.push(`✅ OVERSIGHT APPROVED — ${oversight.reason}`);
  }
  return lines.join("\n");
}

const server = new McpServer(
  { name: "openbid-mcp", version: "0.1.0" },
  { capabilities: {} },
)
  .registerTool(
    {
      name: "list_campaigns",
      description:
        "Return active OpenBid advertiser campaigns — each one is an autonomous media-buying agent with its own budget, max bid, and brand-safety guardrails. Useful for understanding who is competing in the auction.",
      annotations: {
        title: "List OpenBid advertiser campaigns",
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Loading advertiser roster…",
        "openai/toolInvocation/invoked": "Campaigns loaded.",
      },
    },
    async () => {
      return {
        structuredContent: { campaigns },
        content: [
          {
            type: "text",
            text: campaigns
              .map(
                (c) =>
                  `• ${c.brand} (${c.category}) — max £${c.max_bid.toFixed(2)} CPM, budget £${c.budget}, guardrails: ${c.guardrails.length ? c.guardrails.join(", ") : "none"}`,
              )
              .join("\n"),
          },
        ],
        isError: false,
      };
    },
  )
  .registerTool(
    {
      name: "list_scenes",
      description:
        "Return the OpenBid scenes available for bidding. Each scene has a clip, a list of placement slots (with bounding boxes), and platform safety flags (e.g. minor_present) that feed the brand-safety gate.",
      annotations: {
        title: "List OpenBid scenes",
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Loading scene inventory…",
        "openai/toolInvocation/invoked": "Scenes loaded.",
      },
    },
    async () => {
      return {
        structuredContent: { scenes },
        content: [
          {
            type: "text",
            text: scenes
              .map(
                (s) =>
                  `• ${s.scene_id} (${s.duration}s, ${s.slots.length} slot${s.slots.length === 1 ? "" : "s"}) flags=[${s.flags.join(", ") || "none"}]\n  ${s.context}`,
              )
              .join("\n\n"),
          },
        ],
        isError: false,
      };
    },
  )
  .registerTool(
    {
      name: "simulate_auction",
      description:
        "Run a full OpenBid auction for one scene: ranks the bidding agents (second-price / Vickrey), then applies the brand-safety oversight layer. On scene_park_afternoon the alcohol brand wins on price but is blocked by the minor_present rule and the runner-up is promoted — that's the platform's safety gate in action.",
      inputSchema: SimulateInput,
      annotations: {
        title: "Simulate an OpenBid auction",
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Running auction + safety gate…",
        "openai/toolInvocation/invoked": "Auction simulated.",
      },
    },
    async ({ scene_id }) => {
      const scene = getSceneById(scene_id);
      if (!scene) {
        return {
          structuredContent: { error: "scene_not_found", scene_id },
          content: [
            {
              type: "text",
              text: `Unknown scene "${scene_id}". Call list_scenes to see available ids.`,
            },
          ],
          isError: true,
        };
      }

      const bids = sampleBidsFor(scene_id);
      const auction = runAuction(scene.scene_id, bids);
      const oversight = supervise(scene, auction);
      const result: SimulationResult = { scene, auction, oversight };

      return {
        structuredContent: result,
        content: [{ type: "text", text: summariseSimulation(result) }],
        isError: false,
      };
    },
  );

if (process.env.NODE_ENV === "production") {
  const { default: manifest } = await import("./vite-manifest.js");
  server.setViteManifest(manifest);
}

export default await server.run();

export type AppType = typeof server;
