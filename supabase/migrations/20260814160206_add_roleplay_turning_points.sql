-- Guided Roleplay Turning Points
-- A choice belongs to one participant and one conversation. It may award a
-- small, fixed SHARDS reward only once, and its consequence is written into
-- the existing scene canon. Free roleplay messages never earn SHARDS.

ALTER TABLE public.shards_ledger
  DROP CONSTRAINT IF EXISTS shards_ledger_entry_type_check;

ALTER TABLE public.shards_ledger
  ADD CONSTRAINT shards_ledger_entry_type_check
  CHECK (entry_type IN (
    'welcome_credit', 'purchase_credit', 'creative_spend', 'creator_tip_sent',
    'creator_tip_received', 'refund', 'manual_adjustment', 'roleplay_reward'
  ));

CREATE TABLE IF NOT EXISTS public.roleplay_turning_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  scene_prompt text NOT NULL CHECK (char_length(scene_prompt) BETWEEN 1 AND 1200),
  choices jsonb NOT NULL CHECK (jsonb_typeof(choices) = 'array' AND jsonb_array_length(choices) BETWEEN 2 AND 3),
  reward_shards integer NOT NULL DEFAULT 10 CHECK (reward_shards = 10),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  selected_choice_id text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_turning_point_per_roleplay
  ON public.roleplay_turning_points (conversation_id, user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS roleplay_turning_points_user_created_idx
  ON public.roleplay_turning_points (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS shards_one_roleplay_reward_per_turning_point
  ON public.shards_ledger (wallet_user_id, reference_type, reference_id)
  WHERE entry_type = 'roleplay_reward' AND status = 'posted';

ALTER TABLE public.roleplay_turning_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_roleplay_turning_points"
  ON public.roleplay_turning_points
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- No browser-side INSERT, UPDATE, or DELETE policies. A member can only
-- create and resolve their own turning point through the guarded functions.

CREATE OR REPLACE FUNCTION public.create_my_roleplay_turning_point(
  p_conversation_id uuid,
  p_title text,
  p_scene_prompt text,
  p_choices jsonb
)
RETURNS public.roleplay_turning_points
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_point public.roleplay_turning_points;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversations conversation
    JOIN public.conversation_participants participant
      ON participant.conversation_id = conversation.id
    WHERE conversation.id = p_conversation_id
      AND conversation.type = 'dm'
      AND participant.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'This roleplay is not available for guided choices.';
  END IF;

  IF (SELECT count(*) FROM public.messages message WHERE message.conversation_id = p_conversation_id AND message.deleted_at IS NULL) < 8 THEN
    RAISE EXCEPTION 'Let this scene breathe a little longer before opening a turning point.';
  END IF;

  IF jsonb_typeof(p_choices) <> 'array'
     OR jsonb_array_length(p_choices) NOT BETWEEN 2 AND 3
     OR EXISTS (
       SELECT 1
       FROM jsonb_array_elements(p_choices) choice
       WHERE COALESCE(choice->>'id', '') !~ '^[a-z0-9_-]{1,32}$'
          OR char_length(COALESCE(choice->>'label', '')) NOT BETWEEN 1 AND 240
     ) THEN
    RAISE EXCEPTION 'A turning point needs two or three valid choices.';
  END IF;

  INSERT INTO public.roleplay_turning_points (conversation_id, user_id, title, scene_prompt, choices)
  VALUES (p_conversation_id, auth.uid(), trim(p_title), trim(p_scene_prompt), p_choices)
  RETURNING * INTO v_point;

  RETURN v_point;
END;
$$;

REVOKE ALL ON FUNCTION public.create_my_roleplay_turning_point(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_my_roleplay_turning_point(uuid, text, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_my_roleplay_turning_point(
  p_turning_point_id uuid,
  p_choice_id text
)
RETURNS TABLE (
  turning_point_id uuid,
  shards_awarded integer,
  available_balance bigint,
  memory_note text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_point public.roleplay_turning_points;
  v_choice_label text;
  v_memory_note text;
  v_balance bigint;
  v_daily_rewards integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.';
  END IF;

  SELECT * INTO v_point
  FROM public.roleplay_turning_points
  WHERE id = p_turning_point_id
    AND user_id = auth.uid()
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This turning point has already been resolved or is unavailable.';
  END IF;

  SELECT choice->>'label' INTO v_choice_label
  FROM jsonb_array_elements(v_point.choices) choice
  WHERE choice->>'id' = p_choice_id;

  IF v_choice_label IS NULL THEN
    RAISE EXCEPTION 'That choice does not belong to this turning point.';
  END IF;

  SELECT count(*) INTO v_daily_rewards
  FROM public.roleplay_turning_points
  WHERE user_id = auth.uid()
    AND status = 'resolved'
    AND resolved_at >= date_trunc('day', now());

  IF v_daily_rewards >= 3 THEN
    RAISE EXCEPTION 'You have reached today''s three guided-story rewards. You can still roleplay freely.';
  END IF;

  SELECT available_balance INTO v_balance
  FROM public.shards_wallets
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Your SHARDS wallet is not ready yet.';
  END IF;

  v_memory_note := format('• Turning point — %s: You chose “%s”.', v_point.title, v_choice_label);

  UPDATE public.conversations
  SET memory_summary = concat_ws(E'\n', nullif(memory_summary, ''), v_memory_note)
  WHERE id = v_point.conversation_id;

  UPDATE public.roleplay_turning_points
  SET status = 'resolved', selected_choice_id = p_choice_id, resolved_at = now()
  WHERE id = v_point.id;

  UPDATE public.shards_wallets
  SET available_balance = available_balance + v_point.reward_shards,
      lifetime_earned = lifetime_earned + v_point.reward_shards,
      updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING available_balance INTO v_balance;

  INSERT INTO public.shards_ledger (
    wallet_user_id, amount, entry_type, description, reference_type, reference_id
  ) VALUES (
    auth.uid(),
    v_point.reward_shards,
    'roleplay_reward',
    format('Guided roleplay — %s: %s', v_point.title, v_choice_label),
    'roleplay_turning_point',
    v_point.id
  );

  RETURN QUERY SELECT v_point.id, v_point.reward_shards, v_balance, v_memory_note;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_my_roleplay_turning_point(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_my_roleplay_turning_point(uuid, text) TO authenticated;
