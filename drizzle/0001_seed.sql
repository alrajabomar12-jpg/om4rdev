-- Seed data (SPEC §5). Role text is verbatim from the client.
INSERT INTO "site_settings" ("id", "about_text")
VALUES (
  1,
  E'I''m om4r, a 3D modeler and builder on Roblox. I make the maps, models and builds that games are played in.\n\nWant to work together? Reach out on Discord below.'
)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "admin" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "games" ("place_id", "universe_id", "role", "peak_ccu", "sort_order") VALUES
  ('127590941940388', '8284003604', 'Built a map and engine models used in the game.', 40000, 0),
  ('113715117929887', '9720389580', 'Modeled and built the entire game (full time).', 4000, 1),
  ('112184582330960', '9935665660', 'Modeler and builder (full time).', NULL, 2),
  ('89946550882405', '9767488558', 'Modeler and builder.', NULL, 3)
ON CONFLICT ("place_id") DO NOTHING;
