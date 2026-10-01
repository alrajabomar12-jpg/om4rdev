import "server-only";
import { eq } from "drizzle-orm";
import { HttpError } from "@/lib/auth/guard";
import { getDb, schema } from "@/lib/db";
import { fetchGameDetails, fetchGameThumbnails, resolveUniverseId } from "@/lib/roblox/api";
import { parsePlaceUrl } from "@/lib/roblox/parse";

export interface GamePreview {
  placeId: string;
  universeId: string;
  name: string;
  creator: { name: string; verified: boolean };
  playing: number | null;
  visits: number | null;
  thumbnailUrl: string | null;
}

/**
 * Add-game steps 1–3 and 7 (SPEC §6): parse the place ID, reject duplicates, resolve the universe
 * (404 → "Game not found"), then fetch details and thumbnail uncached for the preview.
 */
export async function previewGame(url: string): Promise<GamePreview> {
  const placeId = parsePlaceUrl(url);
  if (!placeId) throw new HttpError(400, "Paste a Roblox game URL like https://www.roblox.com/games/123456789/Name.");

  const [existing] = await getDb()
    .select({ id: schema.games.id })
    .from(schema.games)
    .where(eq(schema.games.placeId, placeId))
    .limit(1);
  if (existing) throw new HttpError(409, "That game is already in the list.");

  let universeId: string | null;
  try {
    universeId = await resolveUniverseId(placeId);
  } catch {
    throw new HttpError(502, "Couldn't reach Roblox. Try again in a minute.");
  }
  if (!universeId) throw new HttpError(404, "Game not found. Check the URL.");

  try {
    const [details, thumbs] = await Promise.all([
      fetchGameDetails([universeId], "fresh"),
      fetchGameThumbnails([universeId], "fresh").catch(() => ({ data: {} as Record<string, string | null> })),
    ]);
    const d = details.data.find((g) => g.id === universeId);
    if (!d) throw new HttpError(404, "Game not found. Check the URL.");
    return {
      placeId,
      universeId,
      name: d.name,
      creator: { name: d.creator.name, verified: d.creator.hasVerifiedBadge },
      playing: d.playing,
      visits: d.visits,
      thumbnailUrl: thumbs.data[universeId] ?? null,
    };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, "Couldn't reach Roblox. Try again in a minute.");
  }
}

export async function getGame(id: string) {
  const [row] = await getDb().select().from(schema.games).where(eq(schema.games.id, id)).limit(1);
  if (!row) throw new HttpError(404, "That game no longer exists.");
  return row;
}
