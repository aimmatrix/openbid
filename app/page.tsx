// app/page.tsx
// LANE C — Teammate 2 owns this file.
//
// This is a working starter. Replace it with the real demo:
//   - VideoPlayer with slot bbox overlays
//   - BiddingPanel streaming agent reasoning + Tavily snippets
//   - OversightPanel (the centrepiece: shows the BLOCK in red)
//   - RenderResult with disclosure overlay
//   - RevenueCounter
//
// Spec: docs/CLAUDE.md §6 (Lane C) and README_TEAM.md.

"use client";

import { useState } from "react";
import type { RunResponse } from "@/lib/types";

const SCENES = [
  { id: "scene_kitchen_morning", label: "Kitchen — coffee should win cleanly" },
  { id: "scene_park_afternoon",  label: "Park (minor_present) — alcohol gets BLOCKED" },
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(scene_id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene_id, tier: 1 }),
      });
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AdBid</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Autonomous media-buying agent · Track 01 · Cursor AdTech London
        </p>
        <p className="text-xs text-amber-400 mt-2">
          STARTER UI — Teammate 2: replace this entire page with the real demo (see README_TEAM.md).
        </p>
      </header>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-zinc-400 mb-3">Run an auction</h2>
        <div className="flex gap-3 flex-wrap">
          {SCENES.map((s) => (
            <button
              key={s.id}
              disabled={loading}
              onClick={() => run(s.id)}
              className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {loading && <p className="text-zinc-400">Running...</p>}
      {error && <pre className="text-red-400 text-xs whitespace-pre-wrap">{error}</pre>}

      {data && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card title="Scene">
            <p className="text-xs text-zinc-400 mb-2">{data.scene.scene_id}</p>
            <p className="text-sm mb-3">{data.scene.context}</p>
            <p className="text-xs text-zinc-500">
              flags: {data.scene.flags.length ? data.scene.flags.join(", ") : "none"} ·{" "}
              {data.scene.slots.length} slots
            </p>
          </Card>

          <Card title="Bids">
            <ul className="space-y-3 text-sm">
              {data.bids.map((b) => (
                <li key={b.agent_id} className="border-l-2 border-zinc-700 pl-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">{b.brand}</span>
                    <span>£{b.bid.toFixed(2)} CPM</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{b.reasoning.slice(0, 220)}...</p>
                  {b.research_snippets && b.research_snippets.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Tavily · {b.research_snippets.length} snippets
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Auction">
            <p className="text-sm">
              Winner: <span className="font-semibold">{data.auction.winner.brand}</span>
            </p>
            <p className="text-xs text-zinc-500">
              Second-price: pays £{data.auction.price.toFixed(2)} CPM
            </p>
          </Card>

          <Card
            title="Oversight"
            tone={data.oversight.decision === "blocked" ? "danger" : "ok"}
          >
            <p className="text-sm">
              Decision:{" "}
              <span
                className={
                  data.oversight.decision === "blocked" ? "text-red-400 font-bold" : "text-green-400 font-bold"
                }
              >
                {data.oversight.decision.toUpperCase()}
              </span>
            </p>
            {data.oversight.triggered_rule && (
              <p className="text-xs text-red-300 mt-1">
                Rule: {data.oversight.triggered_rule}
              </p>
            )}
            <p className="text-sm mt-2">{data.oversight.reason}</p>
            <p className="text-sm mt-3">
              Final winner:{" "}
              <span className="font-semibold">{data.oversight.final_winner.brand}</span>
            </p>
            <details className="mt-3">
              <summary className="text-xs text-zinc-500 cursor-pointer">
                Audit log ({data.oversight.audit_log.length} entries)
              </summary>
              <ul className="text-xs text-zinc-400 mt-2 space-y-1 font-mono">
                {data.oversight.audit_log.map((e, i) => (
                  <li key={i}>
                    [{e.action}] {e.agent_id}: {e.detail}
                  </li>
                ))}
              </ul>
            </details>
          </Card>

          <Card title="Render">
            <p className="text-sm">
              Asset: <code className="text-xs">{data.render.asset_url}</code>
            </p>
            <p className="text-sm">Tier: {data.render.tier}</p>
            <p className="text-sm font-semibold mt-2">{data.render.disclosure}</p>
          </Card>
        </section>
      )}
    </div>
  );
}

function Card({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "danger" | "ok";
}) {
  const border =
    tone === "danger" ? "border-red-500/40" : tone === "ok" ? "border-green-500/40" : "border-zinc-800";
  return (
    <div className={`rounded-lg border ${border} bg-zinc-900/50 p-4`}>
      <h3 className="text-xs uppercase tracking-wider text-zinc-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}
