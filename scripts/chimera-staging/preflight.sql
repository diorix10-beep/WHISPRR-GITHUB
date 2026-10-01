-- Read-only contract check. Run only against an explicitly identified staging project.
DO $$
DECLARE item text; missing text[]:='{}';
BEGIN
 FOREACH item IN ARRAY ARRAY['profiles','ai_characters','personas','conversations','conversation_participants','messages','worlds','lorebooks','lorebook_characters','lorebook_worlds','character_memories','character_relationships','stories','story_chapters','human_roleplay_sessions','human_roleplay_participants','human_roleplay_characters','human_roleplay_messages','human_roleplay_invites','shards_wallets','shards_ledger','vellum_wallets','vellum_ledger','story_scene_illustrations','world_locations','world_factions','world_timeline_events','world_characters','shards_purchase_orders','roleplay_turning_points'] LOOP
  IF to_regclass('public.'||item) IS NULL THEN missing:=array_append(missing,item); END IF;
 END LOOP;
 IF to_regclass('storage.objects') IS NULL THEN missing:=array_append(missing,'storage.objects'); END IF;
 IF cardinality(missing)>0 THEN RAISE EXCEPTION 'Missing prerequisite tables: %',missing; END IF;
 IF to_regprocedure('public.begin_vellum_scene_illustration(uuid,uuid,uuid,text,text,text,integer)') IS NULL OR to_regprocedure('public.create_my_roleplay_turning_point(uuid,text,text,jsonb)') IS NULL OR to_regprocedure('public.send_human_roleplay_message(uuid,text,text,uuid)') IS NULL THEN RAISE EXCEPTION 'Required existing wallet/roleplay functions are missing'; END IF;
END $$;
SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN('profiles','messages','character_memories','stories','story_chapters','shards_wallets','shards_ledger','vellum_wallets','vellum_ledger');
SELECT n.nspname AS schema,p.proname AS function,p.prosecdef AS security_definer,p.proconfig AS settings FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname LIKE '%chimera%' OR p.proname IN('respond_as_ai_character','begin_vellum_scene_illustration','refund_vellum_scene_illustration');

-- Inspect prerequisite contracts only (no creative content or account records).
SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name IN('worlds','stories','story_chapters','project_collaborators','shards_purchase_orders','roleplay_turning_points','story_scene_illustrations') ORDER BY table_name,ordinal_position;
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
WHERE schemaname IN('public','storage') AND tablename IN('project_collaborators','stories','story_chapters','worlds','world_locations','world_factions','world_timeline_events','shards_purchase_orders','roleplay_turning_points','objects');
