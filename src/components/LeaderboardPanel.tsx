import { Trophy } from "lucide-react";
import type { LeaderboardEntry } from "../types";

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  source: "configured" | "sample";
}

export function LeaderboardPanel({ entries, loading, source }: LeaderboardPanelProps) {
  return (
    <section className="rounded-lg border border-white/70 bg-white/70 p-4 text-ink shadow-cloud backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-spotify" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">Leaderboard</h2>
        </div>
        {source === "sample" ? (
          <span className="rounded-full border border-leaf/10 bg-white/55 px-2.5 py-1 text-xs font-semibold text-leaf/65">
            Sample
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="h-28 animate-pulse rounded-lg bg-leaf/10" />
      ) : entries.length ? (
        <ol className="space-y-2">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className="grid min-h-11 grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg border border-leaf/10 bg-white/60 px-3 shadow-sm"
            >
              <span className="text-sm font-semibold text-leaf/45">{index + 1}</span>
              <span className="min-w-0 truncate text-sm font-semibold text-ink">
                {entry.playerName}
              </span>
              <span className="rounded-full bg-spotify/15 px-2.5 py-1 text-sm font-bold text-leaf">
                {entry.score}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid min-h-24 place-items-center rounded-lg border border-dashed border-leaf/15 text-sm font-medium text-leaf/45">
          No scores yet
        </div>
      )}
    </section>
  );
}
