import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

// Roblox IDs are text: universe/place IDs can exceed int32 and are never used in arithmetic.

export const siteSettings = pgTable(
  "site_settings",
  {
    id: integer("id").primaryKey().default(1),
    heroTitle: text("hero_title").notNull().default("3D Modeler & Builder"),
    tagline: text("tagline")
      .notNull()
      .default("I model and build the worlds Roblox players spend hours in."),
    aboutText: text("about_text").notNull(),
    robloxProfileUrl: text("roblox_profile_url")
      .notNull()
      .default("https://www.roblox.com/users/3049207260/profile"),
    robloxUserId: text("roblox_user_id").notNull().default("3049207260"),
    discordUsername: text("discord_username").notNull().default("om4risal"),
    highestPeakCcu: integer("highest_peak_ccu").default(40000),
    logoUrl: text("logo_url"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("site_settings_singleton", sql`${t.id} = 1`),
    check("site_settings_hero_title_len", sql`char_length(${t.heroTitle}) <= 80`),
    check("site_settings_tagline_len", sql`char_length(${t.tagline}) <= 200`),
    check("site_settings_about_len", sql`char_length(${t.aboutText}) <= 2000`),
    check("site_settings_discord_fmt", sql`${t.discordUsername} ~ '^[a-z0-9_.]{2,32}$'`),
    check("site_settings_peak_nonneg", sql`${t.highestPeakCcu} IS NULL OR ${t.highestPeakCcu} >= 0`),
  ],
);

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: text("place_id").notNull().unique(),
    universeId: text("universe_id").notNull(),
    displayNameOverride: text("display_name_override"),
    role: text("role").notNull(),
    peakCcu: integer("peak_ccu"),
    customThumbnailUrl: text("custom_thumbnail_url"),
    includeInTotals: boolean("include_in_totals").notNull().default(true),
    hidden: boolean("hidden").notNull().default(false),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "games_display_name_len",
      sql`${t.displayNameOverride} IS NULL OR char_length(${t.displayNameOverride}) <= 100`,
    ),
    check("games_role_len", sql`char_length(${t.role}) BETWEEN 1 AND 300`),
    check("games_peak_nonneg", sql`${t.peakCcu} IS NULL OR ${t.peakCcu} >= 0`),
    index("games_sort_order_idx").on(t.sortOrder),
  ],
);

export const showcaseItems = pgTable(
  "showcase_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    imageUrl: text("image_url").notNull(),
    caption: text("caption").notNull().default(""),
    alt: text("alt").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("showcase_caption_len", sql`char_length(${t.caption}) <= 200`),
    check("showcase_alt_len", sql`char_length(${t.alt}) <= 200`),
    check("showcase_dims_pos", sql`${t.width} > 0 AND ${t.height} > 0`),
    index("showcase_sort_order_idx").on(t.sortOrder),
  ],
);

export const admin = pgTable(
  "admin",
  {
    id: integer("id").primaryKey().default(1),
    passwordHash: text("password_hash"),
    mustChangePassword: boolean("must_change_password").notNull().default(true),
    consumedResetTokenHash: text("consumed_reset_token_hash"),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  },
  (t) => [check("admin_singleton", sql`${t.id} = 1`)],
);

export const sessions = pgTable(
  "sessions",
  {
    idHash: text("id_hash").primaryKey(),
    mustChangePassword: boolean("must_change_password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_expires_at_idx").on(t.expiresAt)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    success: boolean("success").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("login_attempts_ip_time_idx").on(t.ipHash, t.attemptedAt),
    index("login_attempts_time_idx").on(t.attemptedAt),
  ],
);

export const robloxSnapshot = pgTable("roblox_snapshot", {
  key: text("key").primaryKey(), // 'games' | 'profile'
  data: jsonb("data").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
});
