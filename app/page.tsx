"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunResponse } from "@/lib/types";
import { getSceneById } from "@/mocks/scenes";
import { getAlpicLinks } from "@/lib/alpic-links";
import { BiddingPanel } from "@/components/BiddingPanel";
import { buildMockRunResponse } from "@/components/mockRun";
import { OversightPanel } from "@/components/OversightPanel";
import { RenderResultPanel } from "@/components/RenderResultPanel";
import { RevenueCounter } from "@/components/RevenueCounter";
import { StatusBar } from "@/components/StatusBar";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ConversationStage } from "@/components/ConversationStage";

const SCENES = [
  { id: "scene_kitchen_morning", label: "Kitchen — morning" },
  { id: "scene_park_afternoon", label: "Park — afternoon" },
  { id: "scene_chat_coffee", label: "Chat — sponsored answer" },
] as const;

type DemoPhase = "idle" | "loading" | "bidding" | "auction" | "oversight" | "render" | "done";

async function fetchRun(scene_id: string, tier: 1 | 2): Promise<RunResponse> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scene_id, tier }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export default function Home() {
  const [sceneId, setSceneId] = useState<string>(SCENES[0].id);
  const [data, setData] = useState<RunResponse | null>(null);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [visibleBids, setVisibleBids] = useState(0);
  const [visibleAudit, setVisibleAudit] = useState(0);
  const [showWinner, setShowWinner] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showRender, setShowRender] = useState(false);
  const [showPlacement, setShowPlacement] = useState(false);
  const [vetoed, setVetoed] = useState(false);
  const [tier2Loading, setTier2Loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  const [revenue, setRevenue] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [revenuePopKey, setRevenuePopKey] = useState(0);
  const revenueCounted = useRef(false);

  const resetDemo = useCallback(() => {
    setData(null);
    setPhase("idle");
    setVisibleBids(0);
    setVisibleAudit(0);
    setShowWinner(false);
    setShowVerdict(false);
    setShowRender(false);
    setShowPlacement(false);
    setVetoed(false);
    setError(null);
    revenueCounted.current = false;
  }, []);

  const runOrchestration = useCallback((response: RunResponse) => {
    setData(response);
    setPhase("bidding");
    setVisibleBids(0);
    setVisibleAudit(0);
    setShowWinner(false);
    setShowVerdict(false);
    setShowRender(false);
    setShowPlacement(false);
    setVetoed(false);
    revenueCounted.current = false;
  }, []);

  const loadRun = useCallback(
    async (targetScene: string, tier: 1 | 2 = 1) => {
      setError(null);
      setUsingMock(false);
      if (tier === 1) resetDemo();
      setPhase("loading");

      try {
        const response = await fetchRun(targetScene, tier);
        if (tier === 2 && data) {
          setData({ ...data, render: response.render });
          setPhase("done");
          setShowRender(true);
          setShowPlacement(true);
        } else {
          runOrchestration(response);
        }
      } catch {
        try {
          const mock = buildMockRunResponse(targetScene, tier);
          setUsingMock(true);
          if (tier === 2 && data) {
            setData({ ...data, render: mock.render });
            setPhase("done");
            setShowRender(true);
            setShowPlacement(true);
          } else {
            runOrchestration(mock);
          }
        } catch (mockErr) {
          setError(String(mockErr));
          setPhase("idle");
        }
      } finally {
        setTier2Loading(false);
      }
    },
    [data, resetDemo, runOrchestration],
  );

  const handleRun = () => {
    void loadRun(sceneId, 1);
  };

  const handleTier2 = () => {
    setTier2Loading(true);
    void loadRun(sceneId, 2);
  };

  const handleVeto = () => {
    setVetoed(true);
    setShowRender(false);
    setShowPlacement(false);
  };

  // Stagger bid cards
  useEffect(() => {
    if (phase !== "bidding" || !data) return;
    if (visibleBids >= data.bids.length) {
      const t = setTimeout(() => setPhase("auction"), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleBids((n) => n + 1), 650);
    return () => clearTimeout(t);
  }, [phase, visibleBids, data]);

  // Auction winner
  useEffect(() => {
    if (phase !== "auction") return;
    setShowWinner(true);
    const t = setTimeout(() => setPhase("oversight"), 900);
    return () => clearTimeout(t);
  }, [phase]);

  // Stream audit log
  useEffect(() => {
    if (phase !== "oversight" || !data) return;
    const total = data.oversight.audit_log.length;
    if (visibleAudit < total) {
      const t = setTimeout(() => setVisibleAudit((n) => n + 1), 380);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setShowVerdict(true);
      setPhase("render");
    }, 600);
    return () => clearTimeout(t);
  }, [phase, visibleAudit, data]);

  // Render + revenue
  useEffect(() => {
    if (phase !== "render" || !data) return;
    const t = setTimeout(() => {
      setShowRender(true);
      setShowPlacement(true);
      setPhase("done");

      if (!revenueCounted.current && !vetoed) {
        revenueCounted.current = true;
        const delta = data.auction.price;
        setRevenue((r) => r + delta);
        setLastDelta(delta);
        setRevenuePopKey((k) => k + 1);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [phase, data, vetoed]);

  const previewScene =
    data?.scene ?? getSceneById(sceneId) ?? getSceneById(SCENES[0].id)!;

  const alpic = getAlpicLinks();

  const running =
    phase === "loading" ||
    (phase !== "idle" && phase !== "done" && phase !== "render");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <header className="shrink-0 border-b border-[#26262b] bg-[#141417] px-4 md:px-6 py-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="leading-tight">
            <h1 className="text-xl font-bold tracking-tight">OpenBid</h1>
            <p className="text-[10px] text-zinc-500 font-mono-numeric tracking-wide">
              buy-side ad agent · brand-safe by design
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-mono-numeric uppercase tracking-wider px-2 py-1 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
            Live
          </span>
          {alpic.enabled && alpic.playgroundUrl && (
            <a
              href={alpic.playgroundUrl}
              target="_blank"
              rel="noreferrer"
              title={`Live MCP server on Alpic — ${alpic.host}`}
              className="group flex items-center gap-1.5 text-[10px] font-mono-numeric uppercase tracking-wider px-2 py-1 rounded-full border border-cyan-400/40 text-cyan-300 bg-cyan-400/10 hover:border-cyan-300 hover:text-cyan-200 hover:bg-cyan-400/20 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 live-dot" />
              MCP · Alpic
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100"
                aria-hidden="true"
              >
                <path d="M6 3.5h6.5V10" />
                <path d="M12.5 3.5L6 10" />
                <path d="M12.5 9.5v3h-9v-9h3" />
              </svg>
            </a>
          )}
        </div>

        <div className="flex rounded-lg border border-[#26262b] p-0.5 bg-[#0a0a0b]">
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={running}
              onClick={() => {
                setSceneId(s.id);
                resetDemo();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border border-transparent transition-colors ${
                sceneId === s.id ? "segment-active" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <RevenueCounter total={revenue} lastDelta={lastDelta} popKey={revenuePopKey} />

        <button
          type="button"
          className="btn-primary px-5 py-2.5 text-sm font-mono-numeric"
          onClick={handleRun}
          disabled={phase === "loading" || (phase !== "idle" && phase !== "done")}
        >
          {phase === "loading" ? "Running…" : "Run Auction"}
        </button>
      </header>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded border border-red-500/40 bg-red-500/10 text-xs text-red-300 font-mono-numeric">
          {error}
        </div>
      )}

      {usingMock && phase !== "idle" && (
        <div className="mx-4 mt-2 px-3 py-1.5 rounded border border-amber-500/30 bg-amber-500/5 text-[10px] text-amber-400/90 font-mono-numeric">
          Mock data — /api/run unavailable
        </div>
      )}

      {/* Body */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] xl:items-start gap-4 min-h-0">
        {previewScene.channel === "conversational" ? (
          <ConversationStage
            scene={previewScene}
            active={phase !== "idle" && phase !== "loading"}
            showPlacement={showPlacement && !vetoed}
            placementBrand={data?.oversight.final_winner.brand}
            disclosure={data?.render.disclosure}
          />
        ) : (
          <VideoPlayer
            scene={previewScene}
            active={phase !== "idle" && phase !== "loading"}
            showPlacement={showPlacement && !vetoed}
            placementBrand={data?.oversight.final_winner.brand}
            disclosure={data?.render.disclosure}
            placementSlotId={data?.oversight.final_winner.target_slot}
          />
        )}

        <div className="flex flex-col gap-4 min-h-0 min-w-0 xl:max-h-[calc(100vh-7.5rem)] xl:overflow-y-auto xl:overscroll-contain xl:pr-1">
          <BiddingPanel
            bids={data?.bids ?? []}
            visibleCount={visibleBids}
            auction={showWinner ? (data?.auction ?? null) : null}
            showWinner={showWinner}
          />

          <OversightPanel
            oversight={data?.oversight ?? null}
            auction={data?.auction ?? null}
            visibleAuditCount={visibleAudit}
            showVerdict={showVerdict}
            vetoed={vetoed}
            onVeto={handleVeto}
          />

          <RenderResultPanel
            render={data?.render ?? null}
            scene={data?.scene ?? null}
            finalWinner={data?.oversight.final_winner ?? null}
            visible={showRender}
            vetoed={vetoed}
            tier2Loading={tier2Loading}
            onGenerateTier2={handleTier2}
          />
        </div>
      </main>

      <StatusBar data={data} vetoed={vetoed} phase={phase} />
    </div>
  );
}
