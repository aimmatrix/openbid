"use client";

import type { Scene } from "@/lib/types";
import { brandColor } from "./brandColors";

interface ConversationStageProps {
  scene: Scene;
  active: boolean;
  showPlacement: boolean;
  placementBrand?: string;
  disclosure?: string;
}

// Conversational-channel stage: renders a ChatGPT-style answer with a sponsored
// placement slot that the buy-side agents bid for. Same pipeline as the video
// scenes — only the surface differs.
export function ConversationStage({
  scene,
  active,
  showPlacement,
  placementBrand,
  disclosure,
}: ConversationStageProps) {
  const question = scene.context.match(/"([^"]+)"/)?.[1] ?? scene.context;
  const slot = scene.slots[0];
  const color = placementBrand ? brandColor(placementBrand) : "#22d3ee";

  return (
    <div className="panel flex flex-col overflow-hidden">
      <div className="panel-header">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Conversational Channel</h2>
          <p className="text-xs text-zinc-500 mt-0.5">ChatGPT-style answer · sponsored placement</p>
        </div>
        <span className="text-[10px] font-mono-numeric uppercase tracking-wider px-2 py-1 rounded border border-cyan-500/40 text-cyan-300 bg-cyan-500/10">
          LLM channel
        </span>
      </div>

      <div className="panel-body flex-1 flex flex-col justify-center gap-4">
        {/* User prompt */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100">
            {question}
          </div>
        </div>

        {/* Assistant answer with the placement slot */}
        <div className="flex justify-start">
          <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-[#141417] border border-[#26262b] px-4 py-3 text-sm text-zinc-300 space-y-3">
            <p>Here are a few options that fit what you&rsquo;re after:</p>

            {showPlacement && placementBrand ? (
              <div
                className="rounded-lg border-2 p-3 transition-all"
                style={{ borderColor: color, background: `${color}14` }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                    {placementBrand}
                  </span>
                  <span className="text-[9px] font-mono-numeric px-1.5 py-0.5 rounded bg-black/70 border border-zinc-600 text-zinc-300">
                    {disclosure ?? `Sponsored · ${placementBrand}`}
                  </span>
                </div>
                <p className="text-sm text-zinc-200">
                  {placementBrand} is a strong match — highly recommended for what you described.
                </p>
              </div>
            ) : (
              <div
                className={`rounded-lg border-2 border-dashed p-3 text-center ${active ? "slot-box" : ""}`}
                style={{ borderColor: "#22d3ee" }}
              >
                <span className="text-xs font-mono-numeric uppercase tracking-wide text-cyan-300/80">
                  {active ? "open placement slot — agents bidding…" : slot?.label ?? "placement slot"}
                </span>
              </div>
            )}

            <p className="text-zinc-400 text-xs">
              …plus a couple of unbranded alternatives depending on your priorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
