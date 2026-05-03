export function MatchScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const color = pct >= 75 ? "stroke-emerald-500" : pct >= 50 ? "stroke-amber-500" : "stroke-rose-500";
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} className="stroke-muted" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className={`${color} transition-all duration-700`}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{pct}</span>
        <span className="text-xs text-muted-foreground">match</span>
      </div>
    </div>
  );
}