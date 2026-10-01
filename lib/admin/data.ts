import "server-only";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { DEFAULT_LOGO, getSettings } from "@/lib/home";
import { getLiveGames } from "@/lib/roblox/live";
import { gameUrl } from "@/lib/roblox/parse";

/** Display data for the admin client components: no hashes, sessions or secrets. */
export interface AdminData {
  settings: {
    heroTitle: string;
    tagline: string;
    aboutText: string;
    robloxProfileUrl: string;
    discordUsername: string;
    highestPeakCcu: number | null;
  };
  logo: { url: string; isCustom: boolean };
  games: AdminGame[];
  showcase: AdminShowcaseItem[];
  liveAvailable: boolean;
}

export interface AdminGame {
  id: string;
  href: string;
  robloxName: string | null;
  displayNameOverride: string | null;
  name: string;
  role: string;
  peakCcu: number | null;
  includeInTotals: boolean;
  hidden: boolean;
  customThumbnailUrl: string | null;
  robloxThumbnailUrl: string | null;
  playing: number | null;
  visits: number | null;
}

export interface AdminShowcaseItem {
  id: string;
  src: string;
  caption: string;
  /** Empty when the stored alt is just the default derived from the caption. */
  alt: string;
  width: number;
  height: number;
}

const DEFAULT_ALT = "3D model by om4r";

export async function getAdminData(): Promise<AdminData> {
  const db = getDb();
  const [settings, gameRows, showcaseRows] = await Promise.all([
    getSettings(),
    db.select().from(schema.games).orderBy(asc(schema.games.sortOrder), asc(schema.games.createdAt)),
    db.select().from(schema.showcaseItems).orderBy(asc(schema.showcaseItems.sortOrder)),
  ]);
  const live = await getLiveGames(gameRows.map((g) => g.universeId));

  return {
    settings: {
      heroTitle: settings.heroTitle,
      tagline: settings.tagline,
      aboutText: settings.aboutText,
      robloxProfileUrl: settings.robloxProfileUrl,
      discordUsername: settings.discordUsername,
      highestPeakCcu: settings.highestPeakCcu,
    },
    logo: { url: settings.logoUrl || DEFAULT_LOGO, isCustom: !!settings.logoUrl },
    games: gameRows.map((g) => {
      const l = live.data?.[g.universeId];
      return {
        id: g.id,
        href: gameUrl(g.placeId),
        robloxName: l?.name ?? null,
        displayNameOverride: g.displayNameOverride,
        name: g.displayNameOverride || l?.name || "Untitled game",
        role: g.role,
        peakCcu: g.peakCcu,
        includeInTotals: g.includeInTotals,
        hidden: g.hidden,
        customThumbnailUrl: g.customThumbnailUrl,
        robloxThumbnailUrl: l?.thumbnailUrl ?? null,
        playing: l?.playing ?? null,
        visits: l?.visits ?? null,
      };
    }),
    showcase: showcaseRows.map((s) => ({
      id: s.id,
      src: s.imageUrl,
      caption: s.caption,
      alt: s.alt === s.caption || s.alt === DEFAULT_ALT ? "" : s.alt,
      width: s.width,
      height: s.height,
    })),
    liveAvailable: live.source !== "none",
  };
}
