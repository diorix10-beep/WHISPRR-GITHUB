-- Scene Illustration is VELLUM's first real creative action.
-- The wallet debit is reserved before the external generation call and is
-- refunded exactly once if CHIMERA cannot deliver an illustration.

CREATE TABLE IF NOT EXISTS public.story_scene_illustrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.story_chapters(id) ON DELETE SET NULL,
  prompt text NOT NULL CHECK (char_length(prompt) BETWEEN 12 AND 1800),
  style text NOT NULL CHECK (style IN ('cinematic', 'painterly', 'graphic_novel')),
  aspect_ratio text NOT NULL CHECK (aspect_ratio IN ('16:9', '4:5', '1:1')),
  vellum_cost integer NOT NULL CHECK (vellum_cost > 0),
  storage_path text,
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  refunded_at timestamptz
);

CREATE INDEX IF NOT EXISTS story_scene_illustrations_owner_created_idx
  ON public.story_scene_illustrations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS story_scene_illustrations_chapter_created_idx
  ON public.story_scene_illustrations (chapter_id, created_at DESC);

ALTER TABLE public.story_scene_illustrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_story_scene_illustrations"
  ON public.story_scene_illustrations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Keep the generated source files private. The creator can only read files
-- under their own id; the server uses the service key to write and clean up.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-illustrations',
  'story-illustrations',
  false,
  8388608,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "story_illustrations_owner_select" ON storage.objects;
CREATE POLICY "story_illustrations_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'story-illustrations'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE UNIQUE INDEX IF NOT EXISTS vellum_one_scene_illustration_spend_idx
  ON public.vellum_ledger (wallet_user_id, reference_id)
  WHERE entry_type = 'creative_spend'
    AND reference_type = 'scene_illustration'
    AND status = 'posted';

CREATE UNIQUE INDEX IF NOT EXISTS vellum_one_scene_illustration_refund_idx
  ON public.vellum_ledger (wallet_user_id, reference_id)
  WHERE entry_type = 'refund'
    AND reference_type = 'scene_illustration'
    AND status = 'posted';

CREATE OR REPLACE FUNCTION public.begin_vellum_scene_illustration(
  p_user_id uuid,
  p_story_id uuid,
  p_chapter_id uuid,
  p_prompt text,
  p_style text,
  p_aspect_ratio text,
  p_vellum_cost integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  illustration_id uuid;
  current_balance bigint;
BEGIN
  IF p_vellum_cost <> 400 THEN
    RAISE EXCEPTION 'The Scene Illustration price is invalid.';
  END IF;

  IF char_length(trim(p_prompt)) < 12 OR char_length(trim(p_prompt)) > 1800 THEN
    RAISE EXCEPTION 'Describe the scene in 12 to 1800 characters.';
  END IF;

  IF p_style NOT IN ('cinematic', 'painterly', 'graphic_novel')
     OR p_aspect_ratio NOT IN ('16:9', '4:5', '1:1') THEN
    RAISE EXCEPTION 'The illustration settings are invalid.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = p_story_id AND s.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'You can only illustrate your own story.';
  END IF;

  IF p_chapter_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.story_chapters c
    WHERE c.id = p_chapter_id AND c.story_id = p_story_id
  ) THEN
    RAISE EXCEPTION 'This chapter does not belong to the selected story.';
  END IF;

  SELECT available_balance INTO current_balance
  FROM public.vellum_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Your Storytelling welcome reserve is not available yet.';
  END IF;

  IF current_balance < p_vellum_cost THEN
    RAISE EXCEPTION 'You need % VELLUM to illustrate this scene.', p_vellum_cost;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.story_scene_illustrations
    WHERE user_id = p_user_id AND status = 'generating'
  ) THEN
    RAISE EXCEPTION 'One scene illustration is already being created. Please wait for it to finish.';
  END IF;

  INSERT INTO public.story_scene_illustrations (
    user_id, story_id, chapter_id, prompt, style, aspect_ratio, vellum_cost
  ) VALUES (
    p_user_id, p_story_id, p_chapter_id, trim(p_prompt), p_style, p_aspect_ratio, p_vellum_cost
  ) RETURNING id INTO illustration_id;

  UPDATE public.vellum_wallets
  SET available_balance = available_balance - p_vellum_cost,
      lifetime_spent = lifetime_spent + p_vellum_cost,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.vellum_ledger (
    wallet_user_id, amount, entry_type, description, reference_type, reference_id
  ) VALUES (
    p_user_id, -p_vellum_cost, 'creative_spend', 'Scene Illustration — generation reserved.',
    'scene_illustration', illustration_id
  );

  RETURN illustration_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_vellum_scene_illustration(
  p_illustration_id uuid,
  p_storage_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.story_scene_illustrations
  SET status = 'completed', storage_path = p_storage_path, completed_at = now()
  WHERE id = p_illustration_id AND status = 'generating';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This illustration cannot be completed.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_vellum_scene_illustration(p_illustration_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  illustration public.story_scene_illustrations;
BEGIN
  SELECT * INTO illustration
  FROM public.story_scene_illustrations
  WHERE id = p_illustration_id
  FOR UPDATE;

  IF illustration.id IS NULL OR illustration.status <> 'generating' THEN
    RETURN;
  END IF;

  UPDATE public.vellum_wallets
  SET available_balance = available_balance + illustration.vellum_cost,
      lifetime_spent = GREATEST(lifetime_spent - illustration.vellum_cost, 0),
      updated_at = now()
  WHERE user_id = illustration.user_id;

  INSERT INTO public.vellum_ledger (
    wallet_user_id, amount, entry_type, description, reference_type, reference_id
  ) VALUES (
    illustration.user_id, illustration.vellum_cost, 'refund',
    'Scene Illustration refund — generation did not complete.',
    'scene_illustration', illustration.id
  );

  UPDATE public.story_scene_illustrations
  SET status = 'refunded', refunded_at = now()
  WHERE id = illustration.id;
END;
$$;

REVOKE ALL ON FUNCTION public.begin_vellum_scene_illustration(uuid, uuid, uuid, text, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_vellum_scene_illustration(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_vellum_scene_illustration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.begin_vellum_scene_illustration(uuid, uuid, uuid, text, text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_vellum_scene_illustration(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_vellum_scene_illustration(uuid) TO service_role;
