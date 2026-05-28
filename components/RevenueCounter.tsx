"use client";

interface RevenueCounterProps {
  total: number;
  lastDelta?: number | null;
  popKey?: number;
}

export function RevenueCounter({ total, lastDelta, popKey = 0 }: RevenueCounterProps) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono-numeric">
        Platform Revenue
      </span>
      <div
        key={popKey}
        className="font-mono-numeric text-2xl md:text-3xl font-bold text-emerald-400 glow-green revenue-pop"
      >
        £{total.toFixed(2)}
      </div>
      {lastDelta != null && lastDelta > 0 && (
        <span className="text-xs font-mono-numeric text-emerald-500/80">
          +£{lastDelta.toFixed(2)} served
        </span>
      )}
    </div>
  );
}
