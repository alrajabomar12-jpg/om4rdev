"use client";

import { useSyncExternalStore } from "react";
import { STALE_AFTER_MS } from "@/lib/format";

// A shared 30s clock. The server snapshot is null so the relative time is only computed in
// the browser: the page is cached for minutes, so a server-rendered "N min ago" would be wrong.
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
};
const bucket = () => Math.floor(Date.now() / 30_000);

function ago(ms: number) {
  const min = Math.max(0, Math.round(ms / 60_000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

/** "Live" only for a fresh live fetch; snapshot fallback or data over 30 min old reads "Last updated …". */
export function LiveCaption({ fetchedAt, live }: { fetchedAt: string; live: boolean }) {
  const tick = useSyncExternalStore(subscribe, bucket, () => null);
  const age = tick === null ? null : tick * 30_000 - new Date(fetchedAt).getTime();
  const stale = !live || (age !== null && age > STALE_AFTER_MS);

  return (
    <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-muted">
      {stale ? (
        <span>Last updated {age === null ? "" : ago(age)}</span>
      ) : (
        <>
          <span className="live-dot live-dot-pulse" aria-hidden="true" />
          <span>
            <span className="font-semibold uppercase tracking-[0.2em] text-live">Live</span>
            {age !== null && <> · updated {ago(age)}</>}
          </span>
        </>
      )}
    </p>
  );
}
