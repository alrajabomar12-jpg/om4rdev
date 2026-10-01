import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { fetchGameDetails, fetchGameThumbnails, fetchHeadshot, fetchUser } from "./api";

/**
 * Live Roblox data with the snapshot fallback (SPEC §6):
 *   live OK          → use it, upsert roblox_snapshot if the stored one is > 5 min old
 *   live fails       → use the snapshot's data and its fetchedAt
 *   no snapshot      → source "none": callers render without live numbers
 * Nothing here throws: the page must never fail because of Roblox (or the snapshot table).
 */

export type Source = "live" | "snapshot" | "none";

const liveGameSchema = z.object({
  universeId: z.string(),
  name: z.string(),
  playing: z.number().nullable(),
  visits: z.number().nullable(),
  rootPlaceId: z.string(),
  creator: z.object({ name: z.string(), type: z.string(), hasVerifiedBadge: z.boolean() }),
  /** Temporary rbxcdn URL; only ever stored inside the snapshot. */
  thumbnailUrl: z.string().nullable(),
});
export type LiveGame = z.infer<typeof liveGameSchema>;
const gamesSnapshotSchema = z.record(z.string(), liveGameSchema);

const liveProfileSchema = z.object({
  userId: z.string(),
  name: z.string(),
  displayName: z.string(),
  hasVerifiedBadge: z.boolean(),
  headshotUrl: z.string().nullable(),
});
export type LiveProfile = z.infer<typeof liveProfileSchema>;

export interface LiveResult<T> {
  data: T | null;
  fetchedAt: string | null;
  source: Source;
}

const log = (msg: string, err?: unknown) =>
  console.warn(`[roblox] ${msg}${err ? `: ${err instanceof Error ? err.message : String(err)}` : ""}`);

async function readSnapshot<T>(key: string, parse: z.ZodType<T>): Promise<{ data: T; fetchedAt: Date } | null> {
  try {
    const rows = await getDb()
      .select()
      .from(schema.robloxSnapshot)
      .where(sql`${schema.robloxSnapshot.key} = ${key}`)
      .limit(1);
    if (!rows[0]) return null;
    const parsed = parse.safeParse(rows[0].data);
    return parsed.success ? { data: parsed.data, fetchedAt: rows[0].fetchedAt } : null;
  } catch (err) {
    log(`snapshot read (${key}) failed`, err);
    return null;
  }
}

/** Single statement: inserts, or overwrites only when the stored row is older than 5 minutes. */
async function writeSnapshot(key: string, data: unknown, fetchedAt: Date) {
  try {
    const t = schema.robloxSnapshot;
    await getDb()
      .insert(t)
      .values({ key, data, fetchedAt })
      .onConflictDoUpdate({
        target: t.key,
        set: { data, fetchedAt },
        setWhere: sql`${t.fetchedAt} < now() - interval '5 minutes'`,
      });
  } catch (err) {
    log(`snapshot write (${key}) failed`, err);
  }
}

const earliest = (...dates: Date[]) => new Date(Math.min(...dates.map((d) => d.getTime())));

export async function getLiveGames(universeIds: string[]): Promise<LiveResult<Record<string, LiveGame>>> {
  const ids = [...new Set(universeIds)];
  if (ids.length === 0) return { data: {}, fetchedAt: null, source: "none" };

  const [details, thumbs] = await Promise.allSettled([fetchGameDetails(ids), fetchGameThumbnails(ids)]);

  if (details.status === "fulfilled") {
    let thumbMap: Record<string, string | null> = {};
    let fetchedAt = details.value.fetchedAt;
    if (thumbs.status === "fulfilled") {
      thumbMap = thumbs.value.data;
      fetchedAt = earliest(fetchedAt, thumbs.value.fetchedAt);
    } else {
      // Details are live but thumbnails failed: reuse thumbnails from the snapshot if we have them.
      log("thumbnails failed, using snapshot thumbnails", thumbs.reason);
      const snap = await readSnapshot("games", gamesSnapshotSchema);
      for (const [k, g] of Object.entries(snap?.data ?? {})) thumbMap[k] = g.thumbnailUrl;
    }

    const data: Record<string, LiveGame> = {};
    for (const d of details.value.data) {
      data[d.id] = {
        universeId: d.id,
        name: d.name,
        playing: d.playing,
        visits: d.visits,
        rootPlaceId: d.rootPlaceId,
        creator: { name: d.creator.name, type: d.creator.type, hasVerifiedBadge: d.creator.hasVerifiedBadge },
        thumbnailUrl: thumbMap[d.id] ?? null,
      };
    }
    await writeSnapshot("games", data, fetchedAt);
    return { data, fetchedAt: fetchedAt.toISOString(), source: "live" };
  }

  log("game details failed, falling back to snapshot", details.reason);
  const snap = await readSnapshot("games", gamesSnapshotSchema);
  if (snap) return { data: snap.data, fetchedAt: snap.fetchedAt.toISOString(), source: "snapshot" };
  log("no games snapshot available, rendering without live data");
  return { data: null, fetchedAt: null, source: "none" };
}

export async function getLiveProfile(userId: string): Promise<LiveResult<LiveProfile>> {
  const [user, headshot] = await Promise.allSettled([fetchUser(userId), fetchHeadshot(userId)]);

  if (user.status === "fulfilled") {
    const snapPromise =
      headshot.status === "rejected" ? readSnapshot("profile", liveProfileSchema) : Promise.resolve(null);
    if (headshot.status === "rejected") log("headshot failed, using snapshot headshot", headshot.reason);
    const snap = await snapPromise;
    const data: LiveProfile = {
      userId,
      name: user.value.data.name,
      displayName: user.value.data.displayName,
      hasVerifiedBadge: user.value.data.hasVerifiedBadge,
      headshotUrl:
        headshot.status === "fulfilled"
          ? headshot.value.data
          : snap?.data.userId === userId
            ? snap.data.headshotUrl
            : null,
    };
    const fetchedAt =
      headshot.status === "fulfilled" ? earliest(user.value.fetchedAt, headshot.value.fetchedAt) : user.value.fetchedAt;
    await writeSnapshot("profile", data, fetchedAt);
    return { data, fetchedAt: fetchedAt.toISOString(), source: "live" };
  }

  log("profile failed, falling back to snapshot", user.reason);
  const snap = await readSnapshot("profile", liveProfileSchema);
  // A snapshot for a different user (profile URL changed in admin) is not usable.
  if (snap && snap.data.userId === userId)
    return { data: snap.data, fetchedAt: snap.fetchedAt.toISOString(), source: "snapshot" };
  return { data: null, fetchedAt: null, source: "none" };
}
