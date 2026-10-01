-- Preserve package prices and currency rules; bind repeated checkout attempts to one order.
BEGIN;
ALTER TABLE public.shards_purchase_orders ADD COLUMN IF NOT EXISTS client_request_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS chimera_checkout_retry ON public.shards_purchase_orders(user_id,client_request_id) WHERE client_request_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.prepare_chimera_shards_order(p_user_id uuid,p_request_id uuid,p_package_id text,p_shards integer,p_bonus integer,p_amount integer) RETURNS public.shards_purchase_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_order public.shards_purchase_orders;
BEGIN
 IF p_user_id IS NULL OR p_request_id IS NULL THEN RAISE EXCEPTION 'Owner and request required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('chimera-checkout:'||p_user_id::text,0));
 SELECT * INTO v_order FROM public.shards_purchase_orders WHERE user_id=p_user_id AND client_request_id=p_request_id;
 IF FOUND THEN
  IF v_order.package_id IS DISTINCT FROM p_package_id OR v_order.shards_amount IS DISTINCT FROM p_shards OR v_order.bonus_shards IS DISTINCT FROM p_bonus OR v_order.amount_cents IS DISTINCT FROM p_amount THEN RAISE EXCEPTION 'Request belongs to a different package'; END IF;
  RETURN v_order;
 END IF;
 INSERT INTO public.shards_purchase_orders(user_id,client_request_id,package_id,shards_amount,bonus_shards,amount_cents) VALUES(p_user_id,p_request_id,p_package_id,p_shards,p_bonus,p_amount) RETURNING * INTO v_order;
 RETURN v_order;
END $$;
REVOKE ALL ON FUNCTION public.prepare_chimera_shards_order(uuid,uuid,text,integer,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_chimera_shards_order(uuid,uuid,text,integer,integer,integer) TO service_role;
CREATE INDEX IF NOT EXISTS chimera_illustration_retry_lookup ON chimera_private.ai_requests(user_id,request_key) WHERE operation='illustration';
CREATE OR REPLACE FUNCTION public.recover_chimera_illustration(p_user_id uuid,p_request_key text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_job chimera_private.ai_requests; v_id uuid; v_path text; v_result jsonb;
BEGIN
 SELECT * INTO v_job FROM chimera_private.ai_requests WHERE user_id=p_user_id AND operation='illustration' AND request_key=p_request_key ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','not_found'); END IF;
 IF v_job.state='completed' THEN RETURN jsonb_build_object('state','completed','result',v_job.result); END IF;
 IF v_job.state='failed' THEN RETURN jsonb_build_object('state','failed'); END IF;
 -- Wait well beyond the 45-second provider deadline and 2-minute lease before reconciliation.
 IF v_job.expires_at+interval '5 minutes'>now() THEN RETURN jsonb_build_object('state','running'); END IF;
 v_id:=(v_job.result->>'illustration_id')::uuid;
 IF v_id IS NULL THEN
  UPDATE chimera_private.ai_requests SET state='failed' WHERE id=v_job.id;
  RETURN jsonb_build_object('state','failed');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.story_scene_illustrations WHERE id=v_id AND user_id=p_user_id) THEN RAISE EXCEPTION 'Illustration owner mismatch'; END IF;
 SELECT name INTO v_path FROM storage.objects WHERE bucket_id='story-illustrations' AND name IN(p_user_id::text||'/'||v_id::text||'.png',p_user_id::text||'/'||v_id::text||'.jpg',p_user_id::text||'/'||v_id::text||'.webp') ORDER BY name LIMIT 1;
 IF v_path IS NOT NULL THEN
  v_result:=jsonb_build_object('illustration',jsonb_build_object('id',v_id,'storage_path',v_path,'vellum_cost',400));
  PERFORM public.complete_guarded_chimera_illustration(v_job.id,v_job.lease,v_path,v_result);
  RETURN jsonb_build_object('state','completed','result',v_result);
 END IF;
 PERFORM public.refund_vellum_scene_illustration(v_id);
 UPDATE chimera_private.ai_requests SET state='failed' WHERE id=v_job.id;
 RETURN jsonb_build_object('state','refunded');
END $$;
REVOKE ALL ON FUNCTION public.recover_chimera_illustration(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recover_chimera_illustration(uuid,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.create_my_roleplay_turning_point(uuid,text,text,jsonb) FROM authenticated,anon,PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_my_roleplay_turning_point(uuid,text,text,jsonb) TO service_role;
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
SET search_path = ''
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

  -- Serialize reward claims for this account before counting the daily cap.
  PERFORM pg_advisory_xact_lock(hashtextextended('chimera-guided-rewards:'||auth.uid()::text,0));
  IF v_point.status='resolved' THEN
    IF v_point.selected_choice_id IS DISTINCT FROM p_choice_id THEN RAISE EXCEPTION 'This turning point was resolved with a different choice'; END IF;
    SELECT wallet.available_balance INTO v_balance FROM public.shards_wallets wallet WHERE wallet.user_id=auth.uid();
    v_memory_note:=format('• Turning point — %s: You chose “%s”.',v_point.title,v_choice_label);
    RETURN QUERY SELECT v_point.id,v_point.reward_shards,v_balance,v_memory_note;
    RETURN;
  END IF;

  SELECT count(*) INTO v_daily_rewards
  FROM public.roleplay_turning_points
  WHERE user_id = auth.uid()
    AND status = 'resolved'
    AND resolved_at >= date_trunc('day', now());

  IF v_daily_rewards >= 3 THEN
    RAISE EXCEPTION 'You have reached today''s three guided-story rewards. You can still roleplay freely.';
  END IF;

  SELECT wallet.available_balance INTO v_balance
  FROM public.shards_wallets wallet
  WHERE wallet.user_id = auth.uid()
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

  UPDATE public.shards_wallets AS wallet
  SET available_balance = wallet.available_balance + v_point.reward_shards,
      lifetime_earned = wallet.lifetime_earned + v_point.reward_shards,
      updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING wallet.available_balance INTO v_balance;

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

COMMIT;
