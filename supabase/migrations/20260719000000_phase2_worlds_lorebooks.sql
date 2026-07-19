-- ============================================================
-- Phase 2: Worlds, Lorebooks & Creator Studio Foundation
-- Migration: 20260719000000_phase2_worlds_lorebooks.sql
-- ============================================================

-- ── Extend ai_characters ────────────────────────────────────

ALTER TABLE public.ai_characters
  ADD COLUMN IF NOT EXISTS content_rating text DEFAULT 'SFW' CHECK (content_rating IN ('SFW', 'Mature', 'NSFW')),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS world_id uuid,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.chimera_projects(id) ON DELETE SET NULL;

-- ── Extend stories ──────────────────────────────────────────

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.chimera_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS world_id uuid;

-- ── 1. Worlds ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.worlds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  scenario text NOT NULL DEFAULT '',
  cover_url text,
  tags text[] DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
  settings jsonb DEFAULT '{}',
  project_id uuid REFERENCES public.chimera_projects(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. World Locations ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.world_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  parent_location_id uuid REFERENCES public.world_locations(id) ON DELETE SET NULL,
  image_url text,
  coordinates jsonb,
  properties jsonb DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 3. World Factions ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.world_factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'organization',
  emblem_url text,
  properties jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 4. World Timeline Events ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.world_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date_label text,
  sort_order integer NOT NULL DEFAULT 0,
  event_type text NOT NULL DEFAULT 'historical',
  properties jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Character Relationships ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.character_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid REFERENCES public.worlds(id) ON DELETE CASCADE,
  source_character_id uuid NOT NULL REFERENCES public.ai_characters(id) ON DELETE CASCADE,
  target_character_id uuid NOT NULL REFERENCES public.ai_characters(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'acquaintance',
  description text NOT NULL DEFAULT '',
  strength integer NOT NULL DEFAULT 50 CHECK (strength >= 0 AND strength <= 100),
  bidirectional boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_character_id, target_character_id)
);

-- ── 6. Lorebooks ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lorebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
  entry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 7. Lorebook Entries ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lorebook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lorebook_id uuid NOT NULL REFERENCES public.lorebooks(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  insertion_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 8. Junction Tables ──────────────────────────────────────

-- Characters linked to worlds
CREATE TABLE IF NOT EXISTS public.world_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.ai_characters(id) ON DELETE CASCADE,
  role text DEFAULT 'inhabitant',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(world_id, character_id)
);

-- Lorebooks linked to worlds
CREATE TABLE IF NOT EXISTS public.lorebook_worlds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lorebook_id uuid NOT NULL REFERENCES public.lorebooks(id) ON DELETE CASCADE,
  world_id uuid NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lorebook_id, world_id)
);

-- Lorebooks linked to characters
CREATE TABLE IF NOT EXISTS public.lorebook_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lorebook_id uuid NOT NULL REFERENCES public.lorebooks(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.ai_characters(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lorebook_id, character_id)
);

-- ── Add FK for ai_characters.world_id ───────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ai_characters_world_id_fkey'
  ) THEN
    ALTER TABLE public.ai_characters
      ADD CONSTRAINT ai_characters_world_id_fkey
      FOREIGN KEY (world_id) REFERENCES public.worlds(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stories_world_id_fkey'
  ) THEN
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_world_id_fkey
      FOREIGN KEY (world_id) REFERENCES public.worlds(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── Enable RLS ──────────────────────────────────────────────

ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lorebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lorebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lorebook_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lorebook_characters ENABLE ROW LEVEL SECURITY;

-- ── RLS: Worlds ─────────────────────────────────────────────

CREATE POLICY "select_worlds" ON public.worlds
  FOR SELECT TO authenticated
  USING (visibility = 'public' OR visibility = 'unlisted' OR user_id = auth.uid());

CREATE POLICY "insert_worlds" ON public.worlds
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_worlds" ON public.worlds
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "delete_worlds" ON public.worlds
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── RLS: World Locations ────────────────────────────────────

CREATE POLICY "select_world_locations" ON public.world_locations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worlds WHERE worlds.id = world_locations.world_id AND (worlds.visibility IN ('public','unlisted') OR worlds.user_id = auth.uid())));

CREATE POLICY "manage_world_locations" ON public.world_locations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worlds WHERE worlds.id = world_locations.world_id AND worlds.user_id = auth.uid()));

-- ── RLS: World Factions ─────────────────────────────────────

CREATE POLICY "select_world_factions" ON public.world_factions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worlds WHERE worlds.id = world_factions.world_id AND (worlds.visibility IN ('public','unlisted') OR worlds.user_id = auth.uid())));

CREATE POLICY "manage_world_factions" ON public.world_factions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worlds WHERE worlds.id = world_factions.world_id AND worlds.user_id = auth.uid()));

-- ── RLS: World Timeline ─────────────────────────────────────

CREATE POLICY "select_timeline_events" ON public.world_timeline_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worlds WHERE worlds.id = world_timeline_events.world_id AND (worlds.visibility IN ('public','unlisted') OR worlds.user_id = auth.uid())));

CREATE POLICY "manage_timeline_events" ON public.world_timeline_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worlds WHERE worlds.id = world_timeline_events.world_id AND worlds.user_id = auth.uid()));

-- ── RLS: Character Relationships ────────────────────────────

CREATE POLICY "select_relationships" ON public.character_relationships
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "manage_relationships" ON public.character_relationships
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ai_characters WHERE ai_characters.id = character_relationships.source_character_id AND ai_characters.creator_id = auth.uid())
  );

-- ── RLS: Lorebooks ──────────────────────────────────────────

CREATE POLICY "select_lorebooks" ON public.lorebooks
  FOR SELECT TO authenticated
  USING (visibility = 'public' OR visibility = 'unlisted' OR user_id = auth.uid());

CREATE POLICY "insert_lorebooks" ON public.lorebooks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_lorebooks" ON public.lorebooks
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "delete_lorebooks" ON public.lorebooks
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── RLS: Lorebook Entries ───────────────────────────────────

CREATE POLICY "select_lorebook_entries" ON public.lorebook_entries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lorebooks WHERE lorebooks.id = lorebook_entries.lorebook_id AND (lorebooks.visibility IN ('public','unlisted') OR lorebooks.user_id = auth.uid())));

CREATE POLICY "manage_lorebook_entries" ON public.lorebook_entries
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lorebooks WHERE lorebooks.id = lorebook_entries.lorebook_id AND lorebooks.user_id = auth.uid()));

-- ── RLS: Junction Tables ────────────────────────────────────

CREATE POLICY "select_world_characters" ON public.world_characters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "manage_world_characters" ON public.world_characters
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.worlds WHERE worlds.id = world_characters.world_id AND worlds.user_id = auth.uid()));

CREATE POLICY "select_lorebook_worlds" ON public.lorebook_worlds
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "manage_lorebook_worlds" ON public.lorebook_worlds
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lorebooks WHERE lorebooks.id = lorebook_worlds.lorebook_id AND lorebooks.user_id = auth.uid()));

CREATE POLICY "select_lorebook_characters" ON public.lorebook_characters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "manage_lorebook_characters" ON public.lorebook_characters
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lorebooks WHERE lorebooks.id = lorebook_characters.lorebook_id AND lorebooks.user_id = auth.uid()));

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_worlds_user_id ON public.worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_worlds_visibility ON public.worlds(visibility);
CREATE INDEX IF NOT EXISTS idx_world_locations_world_id ON public.world_locations(world_id);
CREATE INDEX IF NOT EXISTS idx_world_factions_world_id ON public.world_factions(world_id);
CREATE INDEX IF NOT EXISTS idx_world_timeline_world_id ON public.world_timeline_events(world_id);
CREATE INDEX IF NOT EXISTS idx_character_rels_source ON public.character_relationships(source_character_id);
CREATE INDEX IF NOT EXISTS idx_character_rels_target ON public.character_relationships(target_character_id);
CREATE INDEX IF NOT EXISTS idx_lorebooks_user_id ON public.lorebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_lorebook_entries_lorebook_id ON public.lorebook_entries(lorebook_id);
CREATE INDEX IF NOT EXISTS idx_lorebook_entries_keywords ON public.lorebook_entries USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_world_characters_world_id ON public.world_characters(world_id);
CREATE INDEX IF NOT EXISTS idx_world_characters_char_id ON public.world_characters(character_id);
CREATE INDEX IF NOT EXISTS idx_ai_characters_world_id ON public.ai_characters(world_id);
CREATE INDEX IF NOT EXISTS idx_ai_characters_status ON public.ai_characters(status);
CREATE INDEX IF NOT EXISTS idx_stories_world_id ON public.stories(world_id);

-- ── Updated_at Triggers ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'worlds', 'world_locations', 'world_factions',
    'lorebooks', 'lorebook_entries'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ── Update lorebook entry_count trigger ─────────────────────

CREATE OR REPLACE FUNCTION public.update_lorebook_entry_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lorebooks SET entry_count = entry_count + 1 WHERE id = NEW.lorebook_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lorebooks SET entry_count = GREATEST(entry_count - 1, 0) WHERE id = OLD.lorebook_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_entry_count ON public.lorebook_entries;
CREATE TRIGGER update_entry_count
  AFTER INSERT OR DELETE ON public.lorebook_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_lorebook_entry_count();
