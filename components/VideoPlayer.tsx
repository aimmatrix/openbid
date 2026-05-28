"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Scene, Slot } from "@/lib/types";
import { brandColor } from "./brandColors";

interface VideoPlayerProps {
  scene: Scene;
  active: boolean;
  showPlacement: boolean;
  placementBrand?: string;
  disclosure?: string;
  placementSlotId?: string;
}

// Mood backdrop per scene so the stage always looks intentional, even before
// real footage is dropped into /public/clips.
function sceneMood(scene: Scene): string {
  const ctx = (scene.scene_id + " " + scene.context).toLowerCase();
  if (/park|outdoor|afternoon|garden|beach|picnic/.test(ctx)) {
    return "from-emerald-900/50 via-zinc-950 to-sky-950/40";
  }
  if (/kitchen|morning|sunrise|home|coffee|breakfast/.test(ctx)) {
    return "from-amber-900/50 via-zinc-950 to-orange-950/30";
  }
  return "from-zinc-800 via-zinc-950 to-zinc-900";
}

export function VideoPlayer({
  scene,
  active,
  showPlacement,
  placementBrand,
  disclosure,
  placementSlotId,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Reset media state whenever the clip changes.
  useEffect(() => {
    setVideoReady(false);
    setVideoError(false);
  }, [scene.clip_url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      void video.play().catch(() => {
        /* missing/forbidden clip — backdrop stays visible */
      });
    } else {
      video.pause();
    }
  }, [active, scene.clip_url]);

  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  }, []);

  const progress = scene.duration > 0 ? (currentTime / scene.duration) * 100 : 0;
  const placementSlot = scene.slots.find((s) => s.slot_id === placementSlotId);
  const showVideo = videoReady && !videoError;

  return (
    <div className="panel flex flex-col overflow-hidden min-w-0">
      <div className="panel-header">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Video Stage</h2>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{scene.context}</p>
        </div>
        {scene.flags.length > 0 && (
          <span className="text-[10px] font-mono-numeric uppercase tracking-wider px-2 py-1 rounded border border-amber-500/40 text-amber-400 bg-amber-500/10">
            {scene.flags.join(" · ")}
          </span>
        )}
      </div>

      <div className="p-3 pt-0">
        <div className="relative aspect-video rounded-lg overflow-hidden border border-[#26262b] bg-[#0a0a0b] scan-overlay">
          {/* Base layer: mood backdrop — always present so the stage is never blank. */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br ${sceneMood(
              scene,
            )} p-6 text-center transition-opacity duration-500`}
            style={{ opacity: showVideo ? 0 : 1 }}
          >
            <span className="text-[10px] font-mono-numeric text-cyan-400/70 uppercase tracking-[0.25em]">
              {active ? "Scene feed · analysing" : "Scene feed"}
            </span>
            <p className="text-sm text-zinc-300 max-w-md leading-relaxed">{scene.context}</p>
            <span className="text-[10px] font-mono-numeric text-zinc-600">
              {scene.slots.length} placement slots detected
            </span>
          </div>

          {/* Video overlays the backdrop once it actually has frames. */}
          <video
            ref={videoRef}
            src={scene.clip_url}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: showVideo ? 1 : 0 }}
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={() => setVideoReady(true)}
            onTimeUpdate={onTimeUpdate}
            onError={() => setVideoError(true)}
          />

          {scene.slots.map((slot) => (
            <SlotOverlay
              key={slot.slot_id}
              slot={slot}
              visible={active && currentTime >= slot.timestamp}
              isPlacement={
                showPlacement && placementSlot?.slot_id === slot.slot_id && !!placementBrand
              }
              brand={placementBrand}
              disclosure={disclosure}
            />
          ))}

          {/* When there's no real footage, drive the timeline off a clock so slot
              boxes still animate in on cue during a run. */}
          <SlotClock
            active={active && !showVideo}
            duration={scene.duration}
            onTick={setCurrentTime}
          />
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-mono-numeric text-zinc-500 mb-1">
            <span>{currentTime.toFixed(1)}s</span>
            <span>{scene.duration.toFixed(1)}s</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-cyan-500/70 rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            {scene.slots.map((slot) => (
              <div
                key={slot.slot_id}
                className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-cyan-400/90 rounded-sm"
                style={{ left: `${(slot.timestamp / scene.duration) * 100}%` }}
                title={slot.label}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Advances a virtual playhead when no real video is present, so the slot-box
// reveal animation still plays during a run.
function SlotClock({
  active,
  duration,
  onTick,
}: {
  active: boolean;
  duration: number;
  onTick: (t: number) => void;
}) {
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    let raf = 0;
    const loop = () => {
      const elapsed = ((Date.now() - start) / 1000) % duration;
      onTick(elapsed);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, duration, onTick]);
  return null;
}

function SlotOverlay({
  slot,
  visible,
  isPlacement,
  brand,
  disclosure,
}: {
  slot: Slot;
  visible: boolean;
  isPlacement: boolean;
  brand?: string;
  disclosure?: string;
}) {
  const [x, y, w, h] = slot.bbox;
  const color = brand ? brandColor(brand) : "#22d3ee";

  if (!visible) return null;

  return (
    <div
      className="absolute pointer-events-none transition-opacity duration-500"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${w * 100}%`,
        height: `${h * 100}%`,
        opacity: visible ? 1 : 0,
      }}
    >
      <span
        className="absolute -top-6 left-0 max-w-[140%] truncate text-[10px] font-mono-numeric uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/75 border border-cyan-500/40 text-cyan-300"
        style={{ whiteSpace: "nowrap" }}
      >
        {slot.label}
      </span>

      <div
        className={`absolute inset-0 border-2 rounded-sm ${isPlacement ? "" : "slot-box"}`}
        style={{
          borderColor: color,
          background: isPlacement ? `${color}22` : "transparent",
        }}
      />

      {isPlacement && brand && (
        <>
          <div
            className="absolute inset-0 flex items-center justify-center p-1"
            style={{ color }}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-center drop-shadow-lg">
              {brand}
            </span>
          </div>
          {disclosure && (
            <span className="absolute -bottom-5 right-0 text-[9px] font-mono-numeric px-1.5 py-0.5 rounded bg-black/85 border border-zinc-600 text-zinc-300">
              {disclosure}
            </span>
          )}
        </>
      )}
    </div>
  );
}
