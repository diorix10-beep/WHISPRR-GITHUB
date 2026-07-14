-- Migration: NEXA Spirit — Evolving Digital Companion
-- Each user gets a personal spirit entity that evolves with their creative journey.

CREATE TABLE IF NOT EXISTS nexa_spirits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage       smallint NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
  xp          integer NOT NULL DEFAULT 0,
  name        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT  nexa_spirits_user_unique UNIQUE (user_id)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_nexa_spirits_user ON nexa_spirits(user_id);

-- RLS
ALTER TABLE nexa_spirits ENABLE ROW LEVEL SECURITY;

-- Users can read their own spirit
DROP POLICY IF EXISTS "Users can read own spirit" ON nexa_spirits;
CREATE POLICY "Users can read own spirit"
  ON nexa_spirits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own spirit (auto-creation on first visit)
DROP POLICY IF EXISTS "Users can create own spirit" ON nexa_spirits;
CREATE POLICY "Users can create own spirit"
  ON nexa_spirits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own spirit (XP, name, stage)
DROP POLICY IF EXISTS "Users can update own spirit" ON nexa_spirits;
CREATE POLICY "Users can update own spirit"
  ON nexa_spirits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
