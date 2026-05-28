"use client";

import type { AuctionResult, OversightDecision } from "@/lib/types";

interface OversightPanelProps {
  oversight: OversightDecision | null;
  auction: AuctionResult | null;
  visibleAuditCount: number;
  showVerdict: boolean;
  vetoed: boolean;
  onVeto: () => void;
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L4 5v6c0 5.25 3.4 10.15 8 11 4.6-.85 8-5.75 8-11V5l-8-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="rgba(34,211,238,0.08)"
      />
    </svg>
  );
}

function formatTs(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function OversightPanel({
  oversight,
  auction,
  visibleAuditCount,
  showVerdict,
  vetoed,
  onVeto,
}: OversightPanelProps) {
  const blocked = showVerdict && oversight?.decision === "blocked";
  const approved = showVerdict && oversight?.decision === "approved" && !vetoed;

  const auditEntries = oversight?.audit_log.slice(0, visibleAuditCount) ?? [];

  return (
    <div
      className={`panel flex flex-col min-h-[280px] ${
        blocked ? "border-red-500/50 glow-red" : approved ? "border-emerald-500/30" : ""
      }`}
    >
      <div className="panel-header">
        <div className="flex items-center gap-2 text-cyan-400">
          <ShieldIcon />
          <h2 className="text-sm font-semibold text-zinc-100">Oversight · Overmind</h2>
        </div>
        <button
          type="button"
          className="btn-danger px-3 py-1.5 font-mono-numeric"
          onClick={onVeto}
          disabled={!showVerdict || vetoed}
        >
          Veto
        </button>
      </div>

      <div className="panel-body flex flex-col gap-3 flex-1">
        {!oversight && (
          <p className="text-xs text-zinc-500 italic text-center py-8">
            Audit trail will stream here after bidding…
          </p>
        )}

        {vetoed && (
          <div className="rounded-lg border-2 border-red-500 bg-red-500/20 px-4 py-3 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-red-300">
              Human Veto — Placement Cancelled
            </p>
          </div>
        )}

        {blocked && !vetoed && oversight && (
          <div className="block-banner rounded-lg border-2 border-red-500 bg-red-500/15 px-4 py-3 space-y-1">
            <p className="text-base md:text-lg font-bold uppercase tracking-wide text-red-400">
              Blocked — {oversight.triggered_rule}
            </p>
            <p className="text-sm text-red-200/90">{oversight.reason}</p>
          </div>
        )}

        {approved && oversight && (
          <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2.5">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
              Approved
            </p>
            <p className="text-xs text-emerald-200/80 mt-1">{oversight.reason}</p>
          </div>
        )}

        {showVerdict && auction && oversight && !vetoed && (
          <div className="rounded-lg border border-[#26262b] bg-[#0a0a0b]/60 p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono-numeric">
              Winner resolution
            </p>
            {blocked && (
              <p className="text-sm">
                <span className="text-zinc-500">Auction winner: </span>
                <span className="line-through text-red-400 font-semibold">
                  {auction.winner.brand}
                </span>
                <span className="font-mono-numeric text-zinc-500 ml-2">
                  £{auction.winner.bid.toFixed(2)}
                </span>
              </p>
            )}
            <p className="text-sm">
              <span className="text-zinc-500">
                {blocked ? "Promoted runner-up: " : "Final winner: "}
              </span>
              <span className="text-emerald-400 font-bold">{oversight.final_winner.brand}</span>
              <span className="font-mono-numeric text-emerald-500/80 ml-2">
                £{oversight.final_winner.bid.toFixed(2)} CPM
              </span>
            </p>
          </div>
        )}

        {oversight && (
          <div className="flex-1 min-h-[120px]">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono-numeric mb-2">
              Audit log
            </p>
            <ul className="audit-scroll max-h-[160px] overflow-y-auto space-y-1 font-mono-numeric text-[11px]">
              {auditEntries.map((entry, i) => (
                <li
                  key={`${entry.ts}-${entry.action}-${i}`}
                  className="audit-enter flex gap-2 py-0.5 border-b border-zinc-800/80"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="text-zinc-600 shrink-0">{formatTs(entry.ts)}</span>
                  <span
                    className={
                      entry.action === "blocked"
                        ? "text-red-400"
                        : entry.action === "win"
                          ? "text-emerald-400"
                          : entry.action === "bid"
                            ? "text-cyan-400"
                            : "text-zinc-400"
                    }
                  >
                    [{entry.action}]
                  </span>
                  <span className="text-zinc-500 truncate">{entry.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
