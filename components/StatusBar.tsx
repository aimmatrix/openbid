"use client";

import type { RunResponse } from "@/lib/types";
import { getAlpicLinks } from "@/lib/alpic-links";

interface StatusBarProps {
  data: RunResponse | null;
  vetoed: boolean;
  phase: string;
}

function AlpicLink() {
  const alpic = getAlpicLinks();
  if (!alpic.enabled || !alpic.playgroundUrl) return null;
  return (
    <a
      href={alpic.playgroundUrl}
      target="_blank"
      rel="noreferrer"
      title={`Open the live MCP playground — ${alpic.host}`}
      className="text-[11px] font-mono-numeric text-cyan-400/80 hover:text-cyan-300 underline-offset-2 hover:underline"
    >
      mcp · {alpic.host}
    </a>
  );
}

export function StatusBar({ data, vetoed, phase }: StatusBarProps) {
  if (!data) {
    return (
      <footer className="shrink-0 border-t border-[#26262b] bg-[#0a0a0b] px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="text-[11px] font-mono-numeric text-zinc-600">
          openbid · track-01 · awaiting run · second-price (Vickrey) auction
        </p>
        <div className="flex-1" />
        <AlpicLink />
      </footer>
    );
  }

  const blocked = data.oversight.decision === "blocked";
  const agents = data.bids.length;

  return (
    <footer className="shrink-0 border-t border-[#26262b] bg-[#0a0a0b] px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="text-[11px] font-mono-numeric text-zinc-500">
        {data.scene.scene_id}
      </span>
      <span className="text-zinc-700">·</span>
      <span className="text-[11px] font-mono-numeric text-zinc-500">
        {agents} agents
      </span>
      {blocked && (
        <>
          <span className="text-zinc-700">·</span>
          <span className="text-[11px] font-mono-numeric text-red-400">1 blocked</span>
        </>
      )}
      {vetoed && (
        <>
          <span className="text-zinc-700">·</span>
          <span className="text-[11px] font-mono-numeric text-red-400">human veto</span>
        </>
      )}
      <span className="text-zinc-700">·</span>
      <span className="text-[11px] font-mono-numeric text-emerald-500/80">
        2nd-price £{data.auction.price.toFixed(2)}
      </span>
      <span className="text-zinc-700">·</span>
      <span className="text-[11px] font-mono-numeric text-zinc-600 capitalize">{phase}</span>
      <div className="flex-1" />
      <AlpicLink />
    </footer>
  );
}
