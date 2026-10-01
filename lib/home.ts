import "server-only";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { gameUrl } from "@/lib/roblox/parse";
import { getLiveGames, getLiveProfile, type Source } from "@/lib/roblox/live";

export const DEFAULT_LOGO = "/brand/om4r-logo.png";
const FALLBACK_DISPLAY_NAME = "om4r";

export interface GameCard {
  id: string;
  name: string;
  href: string;
  thumbnailUrl: string | null;
  creator: { name: string; verified: boolean } | null;
  role: string;
  peakCcu: number | null;
  /** null when live data is unavailable → the stat item is omitted. */
  playing: number | null;
  visits: number | null;
}

export interface ShowcaseItem {
  id: string;
  src: string;
  caption: string;
  alt: string;
  width: number;
  height: number;
}

export interface HomeData {
  settings: {
    heroTitle: string;
    tagline: string;
    aboutText: string;
    robloxProfileUrl: string;
    discordUsername: string;
    highestPeakCcu: number | null;
    logoUrl: string;
  };
  profile: {
    displayName: string;
    username: string | null;
    hasVerifiedBadge: boolean;
    headshotUrl: string | null;
  };
  games: GameCard[];
  stats: {
    totalVisits: number | null;
    playingNow: number | null;
    highestPeakCcu: number | null;
    fetchedAt: string | null;
    source: Source;
  };
  showcase: ShowcaseItem[];
}

/** Deduped per request: generateMetadata and the page both need it. */
export const getSettings = cache(async () => {
  const db = getDb();
  const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1)).limit(1);
  if (!row) throw new Error("site_settings row missing: run npm run db:migrate");
  return row;
});

export async function getHomeData(): Promise<HomeData> {
  const db = getDb();
  const [settings, gameRows, showcaseRows] = await Promise.all([
    getSettings(),
    db.select().from(schema.games).where(eq(schema.games.hidden, false)).orderBy(asc(schema.games.sortOrder)),
    db.select().from(schema.showcaseItems).orderBy(asc(schema.showcaseItems.sortOrder)),
  ]);

  const [live, profile] = await Promise.all([
    getLiveGames(gameRows.map((g) => g.universeId)),
    getLiveProfile(settings.robloxUserId),
  ]);

  let totalVisits: number | null = null;
  let playingNow: number | null = null;

  const games: GameCard[] = gameRows.map((g) => {
    const l = live.data?.[g.universeId];
    if (l && g.includeInTotals) {
      if (l.visits != null) totalVisits = (totalVisits ?? 0) + l.visits;
      if (l.playing != null) playingNow = (playingNow ?? 0) + l.playing;
    }
    return {
      id: g.id,
      name: g.displayNameOverride || l?.name || "Untitled game",
      href: gameUrl(g.placeId),
      thumbnailUrl: g.customThumbnailUrl || l?.thumbnailUrl || null,
      creator: l ? { name: l.creator.name, verified: l.creator.hasVerifiedBadge } : null,
      role: g.role,
      peakCcu: g.peakCcu,
      playing: l?.playing ?? null,
      visits: l?.visits ?? null,
    };
  });

  return {
    settings: {
      heroTitle: settings.heroTitle,
      tagline: settings.tagline,
      aboutText: settings.aboutText,
      robloxProfileUrl: settings.robloxProfileUrl,
      discordUsername: settings.discordUsername,
      highestPeakCcu: settings.highestPeakCcu,
      logoUrl: settings.logoUrl || DEFAULT_LOGO,
    },
    profile: {
      displayName: profile.data?.displayName ?? FALLBACK_DISPLAY_NAME,
      username: profile.data?.name ?? null,
      hasVerifiedBadge: profile.data?.hasVerifiedBadge === true,
      headshotUrl: profile.data?.headshotUrl ?? null,
    },
    games,
    stats: {
      totalVisits,
      playingNow,
      highestPeakCcu: settings.highestPeakCcu,
      fetchedAt: live.fetchedAt,
      source: live.source,
    },
    showcase: showcaseRows.map((s) => ({
      id: s.id,
      src: s.imageUrl,
      caption: s.caption,
      alt: s.alt || s.caption || "3D model by om4r",
      width: s.width,
      height: s.height,
    })),
  };
}
