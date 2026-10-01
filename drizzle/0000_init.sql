CREATE TABLE "admin" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"password_hash" text,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"consumed_reset_token_hash" text,
	"password_changed_at" timestamp with time zone,
	CONSTRAINT "admin_singleton" CHECK ("admin"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" text NOT NULL,
	"universe_id" text NOT NULL,
	"display_name_override" text,
	"role" text NOT NULL,
	"peak_ccu" integer,
	"custom_thumbnail_url" text,
	"include_in_totals" boolean DEFAULT true NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_place_id_unique" UNIQUE("place_id"),
	CONSTRAINT "games_display_name_len" CHECK ("games"."display_name_override" IS NULL OR char_length("games"."display_name_override") <= 100),
	CONSTRAINT "games_role_len" CHECK (char_length("games"."role") BETWEEN 1 AND 300),
	CONSTRAINT "games_peak_nonneg" CHECK ("games"."peak_ccu" IS NULL OR "games"."peak_ccu" >= 0)
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_hash" text NOT NULL,
	"success" boolean NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roblox_snapshot" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id_hash" text PRIMARY KEY NOT NULL,
	"must_change_password" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showcase_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"alt" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "showcase_caption_len" CHECK (char_length("showcase_items"."caption") <= 200),
	CONSTRAINT "showcase_alt_len" CHECK (char_length("showcase_items"."alt") <= 200),
	CONSTRAINT "showcase_dims_pos" CHECK ("showcase_items"."width" > 0 AND "showcase_items"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"hero_title" text DEFAULT '3D Modeler & Builder' NOT NULL,
	"tagline" text DEFAULT 'I model and build the worlds Roblox players spend hours in.' NOT NULL,
	"about_text" text NOT NULL,
	"roblox_profile_url" text DEFAULT 'https://www.roblox.com/users/3049207260/profile' NOT NULL,
	"roblox_user_id" text DEFAULT '3049207260' NOT NULL,
	"discord_username" text DEFAULT 'om4risal' NOT NULL,
	"highest_peak_ccu" integer DEFAULT 40000,
	"logo_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id" = 1),
	CONSTRAINT "site_settings_hero_title_len" CHECK (char_length("site_settings"."hero_title") <= 80),
	CONSTRAINT "site_settings_tagline_len" CHECK (char_length("site_settings"."tagline") <= 200),
	CONSTRAINT "site_settings_about_len" CHECK (char_length("site_settings"."about_text") <= 2000),
	CONSTRAINT "site_settings_discord_fmt" CHECK ("site_settings"."discord_username" ~ '^[a-z0-9_.]{2,32}$'),
	CONSTRAINT "site_settings_peak_nonneg" CHECK ("site_settings"."highest_peak_ccu" IS NULL OR "site_settings"."highest_peak_ccu" >= 0)
);
--> statement-breakpoint
CREATE INDEX "games_sort_order_idx" ON "games" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_time_idx" ON "login_attempts" USING btree ("ip_hash","attempted_at");--> statement-breakpoint
CREATE INDEX "login_attempts_time_idx" ON "login_attempts" USING btree ("attempted_at");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "showcase_sort_order_idx" ON "showcase_items" USING btree ("sort_order");