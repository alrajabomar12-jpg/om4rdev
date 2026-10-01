import { Eye, Trophy, Users } from "lucide-react";
import type { HomeData } from "@/lib/home";
import { CountUp } from "./CountUp";
import { LiveCaption } from "./LiveCaption";

const COLS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3" };

export function StatsBar({ stats }: Pick<HomeData, "stats">) {
  const cells = [
    stats.totalVisits != null && {
      key: "visits",
      icon: <Eye size={20} aria-hidden="true" />,
      value: stats.totalVisits,
      label: "Total visits",
    },
    stats.playingNow != null && {
      key: "playing",
      icon: <Users size={20} aria-hidden="true" />,
      value: stats.playingNow,
      label: "Playing now",
      live: true,
    },
    stats.highestPeakCcu != null && {
      key: "peak",
      icon: <Trophy size={20} aria-hidden="true" />,
      value: stats.highestPeakCcu,
      label: "Highest peak CCU",
    },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; value: number; label: string; live?: boolean }[];

  if (cells.length === 0) return null;
  const hasLive = stats.totalVisits != null || stats.playingNow != null;

  return (
    <section aria-label="Stats" className="container-site relative z-10 -mt-20 sm:-mt-24">
      <div
        className={`grid divide-y divide-border overflow-hidden rounded-2xl border border-border bg-[rgb(11_16_32/0.72)] shadow-[0_24px_64px_-24px_rgb(0_0_0/0.9)] backdrop-blur-xl md:divide-x md:divide-y-0 ${COLS[cells.length]}`}
      >
        {cells.map((c) => (
          <div key={c.key} className="flex items-center gap-4 px-6 py-6 md:flex-col md:items-start md:gap-5 md:px-8 md:py-8">
            <span className="icon-tile size-11 shrink-0">{c.icon}</span>
            <div className="min-w-0">
              <p className="font-display text-stat flex items-center gap-3">
                {c.live && <span className="live-dot live-dot-pulse size-2.5" aria-hidden="true" />}
                <CountUp value={c.value} />
              </p>
              <p className="eyebrow mt-2 text-muted">{c.label}</p>
            </div>
          </div>
        ))}
      </div>
      {hasLive && stats.fetchedAt && <LiveCaption fetchedAt={stats.fetchedAt} live={stats.source === "live"} />}
    </section>
  );
}
