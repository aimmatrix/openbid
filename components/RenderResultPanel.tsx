"use client";

import type { Bid, RenderResult, Scene } from "@/lib/types";
import { brandColor } from "./brandColors";

interface RenderResultPanelProps {
  render: RenderResult | null;
  scene: Scene | null;
  finalWinner: Bid | null;
  visible: boolean;
  vetoed: boolean;
  tier2Loading: boolean;
  onGenerateTier2: () => void;
}

export function RenderResultPanel({
  render,
  scene,
  finalWinner,
  visible,
  vetoed,
  tier2Loading,
  onGenerateTier2,
}: RenderResultPanelProps) {
  if (!visible || !render || !scene || !finalWinner || vetoed) {
    return (
      <div className="panel opacity-60">
        <div className="panel-header">
          <h2 className="text-sm font-semibold">Served Placement</h2>
        </div>
        <div className="panel-body py-8 text-center">
          <p className="text-xs text-zinc-500 italic">
            {vetoed ? "Placement vetoed — nothing served." : "Awaiting oversight clearance…"}
          </p>
        </div>
      </div>
    );
  }

  const slot =
    scene.slots.find((s) => s.slot_id === finalWinner.target_slot) ?? scene.slots[0];
  const [x, y, w, h] = slot.bbox;
  const color = brandColor(finalWinner.brand);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="text-sm font-semibold">Served Placement</h2>
        <span className="text-[10px] font-mono-numeric uppercase tracking-wider px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">
          Tier {render.tier}
        </span>
      </div>

      <div className="panel-body space-y-3">
        <div className="relative aspect-video rounded-lg overflow-hidden border border-[#26262b] bg-[#0a0a0b]">
          <video
            src={render.asset_url || scene.clip_url}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            muted
            loop
            playsInline
            autoPlay
          />
          <div
            className="absolute border-2 rounded-sm flex items-center justify-center"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${w * 100}%`,
              height: `${h * 100}%`,
              borderColor: color,
              background: `${color}33`,
            }}
          >
            <span
              className="text-xs font-bold uppercase tracking-wider px-1 text-center"
              style={{ color }}
            >
              {finalWinner.brand}
            </span>
          </div>
          <span className="absolute bottom-2 right-2 text-[10px] font-mono-numeric px-2 py-1 rounded bg-black/85 border border-zinc-600 text-zinc-200">
            {render.disclosure}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-zinc-500">Winning brand</p>
            <p className="font-semibold">{finalWinner.brand}</p>
          </div>
          <span className="text-sm font-mono-numeric font-bold px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200">
            {render.disclosure}
          </span>
        </div>

        <button
          type="button"
          className="btn-ghost w-full py-2.5 text-xs font-mono-numeric uppercase tracking-wider"
          onClick={onGenerateTier2}
          disabled={tier2Loading || render.tier === 2}
        >
          {tier2Loading
            ? "Generating AI clip…"
            : render.tier === 2
              ? "Tier 2 clip active"
              : "Generate AI clip (Tier 2)"}
        </button>
      </div>
    </div>
  );
}
