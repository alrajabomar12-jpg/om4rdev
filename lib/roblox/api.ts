import "server-only";
import { z } from "zod";

/**
 * Raw Roblox web API calls (SPEC §6). Every call is server-side, cached for 300s under the
 * 'roblox' tag, times out after 5s and is validated with zod. Callers get a typed value or a
 * thrown error; the fallback policy lives in ./live.ts.
 *
 * ROBLOX_API_DOMAIN (default "roblox.com") exists so dev can point at an unreachable host to
 * test the fallback path, e.g. ROBLOX_API_DOMAIN=roblox.invalid.
 */
const domain = () => process.env.ROBLOX_API_DOMAIN || "roblox.com";

export type CacheMode = "cached" | "fresh";

export class RobloxError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "RobloxError";
  }
}

export interface Fetched<T> {
  data: T;
  /** When Roblox produced the response (its Date header); survives Next's fetch cache. */
  fetchedAt: Date;
}

async function getJson<T>(url: string, schema: z.ZodType<T>, mode: CacheMode): Promise<Fetched<T>> {
  const init: RequestInit =
    mode === "cached"
      ? { next: { revalidate: 300, tags: ["roblox"] }, signal: AbortSignal.timeout(5000) }
      : { cache: "no-store", signal: AbortSignal.timeout(5000) };
  const res = await fetch(url, { ...init, headers: { accept: "application/json" } });
  if (!res.ok) throw new RobloxError(`${res.status} from ${new URL(url).hostname}`, res.status);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new RobloxError(`Unexpected response shape from ${new URL(url).hostname}`);
  const date = new Date(res.headers.get("date") ?? "");
  return { data: parsed.data, fetchedAt: Number.isNaN(date.getTime()) ? new Date() : date };
}

// ---------- Schemas (only the fields we use) ----------

const id = z.union([z.number(), z.string()]).transform(String);

const universeSchema = z.object({ universeId: id.nullable() });

const gameDetailsSchema = z.object({
  data: z.array(
    z.object({
      id,
      rootPlaceId: id,
      name: z.string(),
      playing: z.number().int().nonnegative().nullable().catch(null),
      visits: z.number().int().nonnegative().nullable().catch(null),
      creator: z.object({
        id,
        name: z.string(),
        type: z.string(),
        hasVerifiedBadge: z.boolean(),
      }),
    }),
  ),
});
export type RobloxGameDetails = z.infer<typeof gameDetailsSchema>["data"][number];

const thumbnailSchema = z.object({
  state: z.string(),
  imageUrl: z.string().url().nullable().optional(),
});

const gameThumbsSchema = z.object({
  data: z.array(z.object({ universeId: id, thumbnails: z.array(thumbnailSchema) })),
});

const userSchema = z.object({
  id,
  name: z.string(),
  displayName: z.string(),
  hasVerifiedBadge: z.boolean(),
});
export type RobloxUser = z.infer<typeof userSchema>;

const headshotSchema = z.object({
  data: z.array(z.object({ targetId: id, state: z.string(), imageUrl: z.string().url().nullable().optional() })),
});

/** Anything other than "Completed" counts as missing. */
const completedUrl = (t: { state: string; imageUrl?: string | null } | undefined) =>
  t && t.state === "Completed" && t.imageUrl ? t.imageUrl : null;

// ---------- Endpoints ----------

/** Place → universe. Resolved once when a game is added (admin), never cached. */
export async function resolveUniverseId(placeId: string): Promise<string | null> {
  try {
    const { data } = await getJson(
      `https://apis.${domain()}/universes/v1/places/${encodeURIComponent(placeId)}/universe`,
      universeSchema,
      "fresh",
    );
    return data.universeId;
  } catch (err) {
    if (err instanceof RobloxError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export async function fetchGameDetails(universeIds: string[], mode: CacheMode = "cached") {
  const r = await getJson(
    `https://games.${domain()}/v1/games?universeIds=${universeIds.join(",")}`,
    gameDetailsSchema,
    mode,
  );
  return { data: r.data.data, fetchedAt: r.fetchedAt };
}

export async function fetchGameThumbnails(universeIds: string[], mode: CacheMode = "cached") {
  const r = await getJson(
    `https://thumbnails.${domain()}/v1/games/multiget/thumbnails?universeIds=${universeIds.join(",")}&countPerUniverse=1&size=768x432&format=Png&isCircular=false`,
    gameThumbsSchema,
    mode,
  );
  const map: Record<string, string | null> = {};
  for (const row of r.data.data) map[row.universeId] = completedUrl(row.thumbnails[0]);
  return { data: map, fetchedAt: r.fetchedAt };
}

export async function fetchUser(userId: string) {
  return getJson(`https://users.${domain()}/v1/users/${encodeURIComponent(userId)}`, userSchema, "cached");
}

export async function fetchHeadshot(userId: string) {
  const r = await getJson(
    `https://thumbnails.${domain()}/v1/users/avatar-headshot?userIds=${encodeURIComponent(userId)}&size=420x420&format=Png&isCircular=false`,
    headshotSchema,
    "cached",
  );
  return { data: completedUrl(r.data.data[0]), fetchedAt: r.fetchedAt };
}
