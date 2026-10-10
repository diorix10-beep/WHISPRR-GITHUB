-- Universe rules: what the world of a roleplay is like, written by the player who runs the scene.
-- Genre, technology, the ways people can reach each other over distance (phone, letters, a scrying
-- mirror, a communicator...), how time is counted, customs and laws. Every later feature (messages
-- inside the story, story time, ...) reads these rules instead of assuming a modern world.
--
-- It lives in the player's own settings row for the scene (same table, same row-level security: only
-- that player, only while they are in the scene). Additive only: one new column with a default, so
-- every existing row keeps working and nothing is rewritten.
--
--   universe_rules   a JSON object, at most 4,000 bytes. The shape is checked by the app and again by the
--                    server before it reaches the prompt; the database only guarantees "an object, not huge".
ALTER TABLE public.chimera_scene_settings
  ADD COLUMN universe_rules jsonb NOT NULL DEFAULT '{}'::jsonb
    CONSTRAINT chimera_scene_settings_universe_rules_check
    CHECK (jsonb_typeof(universe_rules) = 'object' AND octet_length(universe_rules::text) <= 4000);
