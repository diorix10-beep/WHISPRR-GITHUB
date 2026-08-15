-- Public roleplay is a deliberate, immutable-at-the-message-level scene snapshot.
-- A conversation remains private until its owner explicitly creates a scene here.

CREATE TABLE IF NOT EXISTS public.roleplay_public_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 140),
  summary text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 600),
  visibility text NOT NULL DEFAULT 'unlisted' CHECK (visibility IN ('unlisted', 'public')),
  content_rating text NOT NULL DEFAULT 'limited' CHECK (content_rating IN ('limited', 'mature')),
  published_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roleplay_public_scenes_public_feed_idx
  ON public.roleplay_public_scenes (published_at DESC)
  WHERE visibility = 'public';

CREATE TABLE IF NOT EXISTS public.roleplay_public_scene_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid NOT NULL REFERENCES public.roleplay_public_scenes(id) ON DELETE CASCADE,
  source_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  author_label text NOT NULL CHECK (char_length(author_label) BETWEEN 1 AND 120),
  author_kind text NOT NULL CHECK (author_kind IN ('member', 'character')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 12000),
  position integer NOT NULL CHECK (position >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scene_id, position)
);

CREATE INDEX IF NOT EXISTS roleplay_public_scene_messages_scene_idx
  ON public.roleplay_public_scene_messages (scene_id, position);

ALTER TABLE public.roleplay_public_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roleplay_public_scene_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roleplay_public_scenes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roleplay_public_scene_messages TO authenticated;

DROP POLICY IF EXISTS "scene owner can manage their scenes" ON public.roleplay_public_scenes;
CREATE POLICY "scene owner can manage their scenes"
  ON public.roleplay_public_scenes
  FOR ALL TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "members can view discoverable scenes" ON public.roleplay_public_scenes;
CREATE POLICY "members can view discoverable scenes"
  ON public.roleplay_public_scenes
  FOR SELECT TO authenticated
  USING (visibility = 'public');

DROP POLICY IF EXISTS "scene owner can manage scene snapshots" ON public.roleplay_public_scene_messages;
CREATE POLICY "scene owner can manage scene snapshots"
  ON public.roleplay_public_scene_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roleplay_public_scenes scenes
      WHERE scenes.id = scene_id AND scenes.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roleplay_public_scenes scenes
      WHERE scenes.id = scene_id AND scenes.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "members can read discoverable scene snapshots" ON public.roleplay_public_scene_messages;
CREATE POLICY "members can read discoverable scene snapshots"
  ON public.roleplay_public_scene_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roleplay_public_scenes scenes
      WHERE scenes.id = scene_id AND scenes.visibility = 'public'
    )
  );
