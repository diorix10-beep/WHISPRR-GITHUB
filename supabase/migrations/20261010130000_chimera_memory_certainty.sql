-- Narrative memory with two honest distinctions, on the table that already holds the player's private memories
-- (public.character_memories: one player, one character, one persona, optionally one scene; suggested by the story or
-- written by hand; used by the character only once the player keeps it).
--
--   certainty   how sure the story is about it
--                 canon       confirmed: true in the story (what every existing memory is)
--                 temporary   true for now, expected to change (an injury, a journey, a plan); this scene only
--                 assumption  a belief, rumour or suspicion; characters may be wrong about it; this scene only
--   known_by    who knows it
--                 character   the character knows it and may act on it (what every existing memory is)
--                 player      only the player knows it: kept as the player's own note, never sent to the AI
--
-- The story may suggest a certainty, never a "who knows": that is the player's call. A suggestion is still only a
-- suggestion until the player keeps it.
--
-- Additive only: two columns with defaults (every existing row becomes "canon" and "character", exactly what it was) and
-- one rule: something that is not confirmed canon cannot be kept for every scene, because a rumour or a passing state
-- must not follow the character into stories where it was never said.
ALTER TABLE public.character_memories
  ADD COLUMN certainty text NOT NULL DEFAULT 'canon'
    CONSTRAINT character_memories_certainty_check CHECK (certainty IN ('canon', 'temporary', 'assumption')),
  ADD COLUMN known_by text NOT NULL DEFAULT 'character'
    CONSTRAINT character_memories_known_by_check CHECK (known_by IN ('character', 'player'));

ALTER TABLE public.character_memories
  ADD CONSTRAINT character_memories_only_canon_everywhere
    CHECK (certainty = 'canon' OR conversation_id IS NOT NULL OR session_id IS NOT NULL);
