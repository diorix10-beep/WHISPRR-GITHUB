-- PR #12: serialize hybrid-room adult access against every accepted member.
BEGIN;
CREATE OR REPLACE FUNCTION chimera_private.require_character_request_access(p_user uuid,p_resource text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_scene uuid; v_bot uuid;
BEGIN
 IF p_user IS NULL THEN RAISE EXCEPTION 'Roleplay permission changed' USING ERRCODE='42501'; END IF;
 IF split_part(p_resource,':',1)='room' THEN
   -- Room first, then every affected preference row in UUID order. Membership
   -- and another participant's age/consent cannot race the authorization read.
   PERFORM 1 FROM public.human_roleplay_sessions WHERE id=split_part(p_resource,':',2)::uuid FOR UPDATE;
   PERFORM pref.user_id FROM public.chimera_user_preferences pref
   WHERE pref.user_id=p_user OR pref.user_id IN (
     SELECT member.user_id FROM public.human_roleplay_participants member
     WHERE member.session_id=split_part(p_resource,':',2)::uuid AND member.status='accepted')
   ORDER BY pref.user_id FOR SHARE OF pref;
   IF NOT chimera_private.room_ai_allowed(split_part(p_resource,':',2)::uuid,p_user,split_part(p_resource,':',3)::uuid)
   THEN RAISE EXCEPTION 'Room permission changed' USING ERRCODE='42501'; END IF;
 ELSE
   PERFORM 1 FROM public.chimera_user_preferences WHERE user_id=p_user FOR SHARE;
   v_scene:=split_part(p_resource,':',1)::uuid; v_bot:=split_part(p_resource,':',2)::uuid;
   IF NOT EXISTS(SELECT 1 FROM public.conversation_participants cp JOIN public.ai_characters a ON a.user_id=cp.user_id
      WHERE cp.conversation_id=v_scene AND cp.user_id=v_bot AND chimera_private.can_read_character_for_user(a.id,p_user))
      OR NOT EXISTS(SELECT 1 FROM public.conversation_participants WHERE conversation_id=v_scene AND user_id=p_user)
      OR EXISTS(SELECT 1 FROM public.conversations c WHERE c.id=v_scene AND c.character_id IS NOT NULL
        AND NOT chimera_private.can_read_character_for_user(c.character_id,p_user))
      OR EXISTS(SELECT 1 FROM public.conversation_participants cp JOIN public.ai_characters a ON a.user_id=cp.user_id
        WHERE cp.conversation_id=v_scene AND NOT chimera_private.can_read_character_for_user(a.id,p_user))
   THEN RAISE EXCEPTION 'Roleplay permission changed' USING ERRCODE='42501'; END IF;
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.require_character_request_access(uuid,text) FROM PUBLIC,anon,authenticated;
COMMIT;
