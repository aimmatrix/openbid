"use client";

import type { AuctionResult, Bid } from "@/lib/types";
import { brandColor } from "./brandColors";

interface BiddingPanelProps {
  bids: Bid[];
  visibleCount: number;
  auction: AuctionResult | null;
  showWinner: boolean;
}

export function BiddingPanel({ bids, visibleCount, auction, showWinner }: BiddingPanelProps) {
  const sorted = [...bids].sort((a, b) => b.bid - a.bid);
  const visible = sorted.slice(0, visibleCount);
  const highBidder = visible.length > 0 ? visible[0] : null;

  return (
    <div className="panel flex flex-col shrink-0 overflow-hidden min-h-[220px] max-h-[320px]">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Advertiser Agents</h2>
          <span className="text-[10px] font-mono-numeric px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-400">
            {visible.length}/{bids.length} live
          </span>
        </div>
        {showWinner && auction && (
          <span className="text-[10px] font-mono-numeric uppercase tracking-wider px-2 py-1 rounded border border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
            Winner · {auction.winner.brand}
          </span>
        )}
      </div>

      <div className="panel-body flex flex-col gap-2 flex-1 overflow-y-auto max-h-[280px]">
        {visible.length === 0 && (
          <p className="text-xs text-zinc-500 italic py-4 text-center">
            Waiting for agents to research & bid…
          </p>
        )}

        {visible.map((bid, i) => {
          const isHigh = highBidder?.agent_id === bid.agent_id && !showWinner;
          const isAuctionWinner = showWinner && auction?.winner.agent_id === bid.agent_id;
          const sources = bid.research_snippets?.length ?? 0;

          return (
            <article
              key={bid.agent_id}
              className={`bid-enter rounded-lg border p-3 transition-shadow ${
                isAuctionWinner
                  ? "border-emerald-500/60 bg-emerald-500/5 glow-cyan-border"
                  : isHigh
                    ? "border-cyan-500/50 bg-cyan-500/5 glow-cyan-border"
                    : "border-[#26262b] bg-[#0a0a0b]/50"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: brandColor(bid.brand) }}
                  />
                  <span className="font-semibold text-sm truncate">{bid.brand}</span>
                </div>
                <span className="font-mono-numeric text-lg font-bold text-zinc-100 shrink-0">
                  £{bid.bid.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-zinc-500">CPM</span>
                </span>
              </div>

              <p className="text-xs text-zinc-400 italic mt-2 leading-relaxed line-clamp-3">
                &ldquo;{bid.reasoning}&rdquo;
              </p>

              {sources > 0 && (
                <span className="inline-block mt-2 text-[10px] font-mono-numeric uppercase tracking-wide px-2 py-0.5 rounded border border-zinc-700 text-cyan-400/90 bg-cyan-500/5">
                  Tavily · {sources} {sources === 1 ? "source" : "sources"}
                </span>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
