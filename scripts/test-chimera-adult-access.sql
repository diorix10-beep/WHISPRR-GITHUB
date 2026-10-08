BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('aafbf831-0aa2-4e10-a001-000000000001','pr11-security-user@example.invalid','{}'),
 ('aafbf831-0aa2-4e10-a001-000000000002','pr11-security-safe@example.invalid','{}'),
 ('aafbf831-0aa2-4e10-a001-000000000003','pr11-security-mature@example.invalid','{}'),
 ('aafbf831-0aa2-4e10-a001-000000000004','pr11-security-nsfw@example.invalid','{}');
UPDATE public.profiles SET role='ai_character' WHERE user_id IN
 ('aafbf831-0aa2-4e10-a001-000000000002','aafbf831-0aa2-4e10-a001-000000000003','aafbf831-0aa2-4e10-a001-000000000004');
INSERT INTO public.ai_characters(id,user_id,creator_id,greeting,chat_name,content_rating,visibility) VALUES
 ('aafbf831-0aa2-4e10-a002-000000000001','aafbf831-0aa2-4e10-a001-000000000002','aafbf831-0aa2-4e10-a001-000000000001','SFW sentinel','safe','SFW','public'),
 ('aafbf831-0aa2-4e10-a002-000000000002','aafbf831-0aa2-4e10-a001-000000000003','aafbf831-0aa2-4e10-a001-000000000001','Mature sentinel','mature','Mature','public'),
 ('aafbf831-0aa2-4e10-a002-000000000003','aafbf831-0aa2-4e10-a001-000000000004','aafbf831-0aa2-4e10-a001-000000000001','NSFW sentinel','nsfw','NSFW','unlisted');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','anon',true);
DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.ai_characters WHERE id::text LIKE 'aafbf831-0aa2-4e10-a002-%') THEN RAISE EXCEPTION 'Anonymous test failed'; END IF; END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aafbf831-0aa2-4e10-a001-000000000001',true),set_config('request.jwt.claim.role','authenticated',true);
DO $$ BEGIN IF (SELECT count(*) FROM public.ai_characters WHERE id::text LIKE 'aafbf831-0aa2-4e10-a002-%')<>1 THEN RAISE EXCEPTION 'Unverified test failed'; END IF; END $$;
RESET ROLE;
SELECT public.set_age_verification('aafbf831-0aa2-4e10-a001-000000000001','verified_adult');
SET LOCAL ROLE authenticated;
DO $$ BEGIN IF (SELECT count(*) FROM public.ai_characters WHERE id::text LIKE 'aafbf831-0aa2-4e10-a002-%')<>1 THEN RAISE EXCEPTION 'No-consent test failed'; END IF; END $$;
UPDATE public.chimera_user_preferences SET adult_content_enabled=true WHERE user_id=auth.uid();
DO $$ BEGIN IF (SELECT count(*) FROM public.ai_characters WHERE id::text LIKE 'aafbf831-0aa2-4e10-a002-%')<>3 THEN RAISE EXCEPTION 'Verified adult test failed'; END IF; END $$;
RESET ROLE;
SELECT public.set_age_verification('aafbf831-0aa2-4e10-a001-000000000001','unverified');
SET LOCAL ROLE authenticated;
DO $$ BEGIN IF (SELECT count(*) FROM public.ai_characters WHERE id::text LIKE 'aafbf831-0aa2-4e10-a002-%')<>1 THEN RAISE EXCEPTION 'Revocation test failed'; END IF; END $$;
RESET ROLE;
INSERT INTO public.conversations(id,type,created_by) VALUES('aafbf831-0aa2-4e10-a003-000000000001','dm','aafbf831-0aa2-4e10-a001-000000000001');
INSERT INTO public.conversation_participants(conversation_id,user_id) VALUES
 ('aafbf831-0aa2-4e10-a003-000000000001','aafbf831-0aa2-4e10-a001-000000000001'),
 ('aafbf831-0aa2-4e10-a003-000000000001','aafbf831-0aa2-4e10-a001-000000000003');
INSERT INTO chimera_private.ai_requests(id,user_id,operation,resource,request_key,fingerprint,state,lease,expires_at) VALUES
 ('aafbf831-0aa2-4e10-a004-000000000001','aafbf831-0aa2-4e10-a001-000000000001','chat',
 'aafbf831-0aa2-4e10-a003-000000000001:aafbf831-0aa2-4e10-a001-000000000003','hosted-test',repeat('a',64),'running',
 'aafbf831-0aa2-4e10-a005-000000000001',now()+interval '2 minutes');
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','service_role',true);
DO $$ BEGIN
 BEGIN
 PERFORM public.complete_chimera_chat_request('aafbf831-0aa2-4e10-a004-000000000001','aafbf831-0aa2-4e10-a005-000000000001',
 'aafbf831-0aa2-4e10-a003-000000000001','aafbf831-0aa2-4e10-a001-000000000003','restricted reply');
 RAISE EXCEPTION 'Revoked service completion test failed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT public.set_age_verification('aafbf831-0aa2-4e10-a001-000000000001','verified_adult');
UPDATE public.chimera_user_preferences SET adult_content_enabled=true WHERE user_id='aafbf831-0aa2-4e10-a001-000000000001';
SET LOCAL ROLE service_role;
SELECT public.complete_chimera_chat_request('aafbf831-0aa2-4e10-a004-000000000001','aafbf831-0aa2-4e10-a005-000000000001',
 'aafbf831-0aa2-4e10-a003-000000000001','aafbf831-0aa2-4e10-a001-000000000003','restricted reply');
RESET ROLE;
DO $$ BEGIN IF (SELECT state FROM chimera_private.ai_requests WHERE id='aafbf831-0aa2-4e10-a004-000000000001')<>'completed' THEN RAISE EXCEPTION 'Eligible service completion test failed'; END IF; END $$;
UPDATE public.chimera_user_preferences SET adult_content_enabled=false WHERE user_id='aafbf831-0aa2-4e10-a001-000000000001';
SET LOCAL ROLE service_role;
DO $$ BEGIN
 BEGIN
 PERFORM public.get_chimera_ai_request('aafbf831-0aa2-4e10-a004-000000000001','aafbf831-0aa2-4e10-a005-000000000001');
 RAISE EXCEPTION 'Revoked cached reply test failed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: hosted identity matrix, service completion and cached-reply revocation; all test data rolled back' AS result;
