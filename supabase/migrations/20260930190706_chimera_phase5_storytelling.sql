-- Creator-controlled collaboration and world presentation. No content or wallet rewrites.
BEGIN;
CREATE TABLE IF NOT EXISTS public.project_collaborators (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),project_id uuid NOT NULL,
 project_type text NOT NULL CHECK(project_type IN('story','world')),
 user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'editor' CHECK(role IN('editor','viewer')),
 invited_by uuid NOT NULL REFERENCES public.profiles(user_id),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','accepted','declined','revoked')),
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(project_type,project_id,user_id)
);
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION chimera_private.project_owner(p_type text,p_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT user_id FROM public.stories WHERE p_type='story' AND id=p_id UNION ALL SELECT user_id FROM public.worlds WHERE p_type='world' AND id=p_id;
$$;
CREATE OR REPLACE FUNCTION public.can_access_chimera_project(p_type text,p_id uuid,p_edit boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND coalesce((chimera_private.project_owner(p_type,p_id)=auth.uid() OR EXISTS(SELECT 1 FROM public.project_collaborators WHERE project_type=p_type AND project_id=p_id AND user_id=auth.uid() AND status='accepted' AND (NOT p_edit OR role='editor'))),false);
$$;
REVOKE ALL ON FUNCTION chimera_private.project_owner(text,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_chimera_project(text,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_access_chimera_project(text,uuid,boolean) TO authenticated;
DROP POLICY IF EXISTS chimera_collaborator_read ON public.project_collaborators;
CREATE POLICY chimera_collaborator_read ON public.project_collaborators FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.can_access_chimera_project(project_type,project_id));
GRANT SELECT ON public.project_collaborators TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.project_collaborators FROM authenticated,anon;
CREATE OR REPLACE FUNCTION public.invite_chimera_collaborator(p_type text,p_project_id uuid,p_user_id uuid,p_role text DEFAULT 'editor') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid;
BEGIN
 IF auth.uid() IS NULL OR chimera_private.project_owner(p_type,p_project_id) IS DISTINCT FROM auth.uid() OR p_user_id=auth.uid() OR p_role NOT IN('editor','viewer') OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=p_user_id AND role<>'ai_character') THEN RAISE EXCEPTION 'Owner permission and a human collaborator required'; END IF;
 INSERT INTO public.project_collaborators(project_type,project_id,user_id,invited_by,role) VALUES(p_type,p_project_id,p_user_id,auth.uid(),p_role) ON CONFLICT(project_type,project_id,user_id) DO UPDATE SET status=CASE WHEN project_collaborators.status='accepted' THEN 'accepted' ELSE 'pending' END,role=p_role,invited_by=auth.uid() RETURNING id INTO v_id;
 RETURN v_id;
END; $$;
CREATE OR REPLACE FUNCTION public.respond_chimera_collaboration(p_id uuid,p_accept boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.project_collaborators SET status=CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END WHERE id=p_id AND user_id=auth.uid() AND status='pending';
 IF NOT FOUND THEN RAISE EXCEPTION 'A pending invitation addressed to you is required'; END IF;
END; $$;
CREATE OR REPLACE FUNCTION public.revoke_chimera_collaborator(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.project_collaborators SET status='revoked' WHERE id=p_id AND (user_id=auth.uid() OR chimera_private.project_owner(project_type,project_id)=auth.uid());
 IF NOT FOUND THEN RAISE EXCEPTION 'Owner or invited participant permission required'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.invite_chimera_collaborator(text,uuid,uuid,text),public.respond_chimera_collaboration(uuid,boolean),public.revoke_chimera_collaborator(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.invite_chimera_collaborator(text,uuid,uuid,text),public.respond_chimera_collaboration(uuid,boolean),public.revoke_chimera_collaborator(uuid) TO authenticated;
DROP POLICY IF EXISTS chimera_story_collaborator_read ON public.stories;
CREATE POLICY chimera_story_collaborator_read ON public.stories FOR SELECT TO authenticated USING(public.can_access_chimera_project('story',id));
DROP POLICY IF EXISTS chimera_chapter_collaborator_read ON public.story_chapters;
CREATE POLICY chimera_chapter_collaborator_read ON public.story_chapters FOR SELECT TO authenticated USING(public.can_access_chimera_project('story',story_id));
DROP POLICY IF EXISTS chimera_chapter_collaborator_insert ON public.story_chapters;
CREATE POLICY chimera_chapter_collaborator_insert ON public.story_chapters FOR INSERT TO authenticated WITH CHECK(public.can_access_chimera_project('story',story_id,true));
DROP POLICY IF EXISTS chimera_chapter_collaborator_update ON public.story_chapters;
CREATE POLICY chimera_chapter_collaborator_update ON public.story_chapters FOR UPDATE TO authenticated USING(public.can_access_chimera_project('story',story_id,true)) WITH CHECK(public.can_access_chimera_project('story',story_id,true));
DROP POLICY IF EXISTS chimera_world_collaborator_read ON public.worlds;
CREATE POLICY chimera_world_collaborator_read ON public.worlds FOR SELECT TO authenticated USING(public.can_access_chimera_project('world',id));
-- Editors work on chapters/world details. Ownership and publication stay with the creator.
CREATE OR REPLACE FUNCTION chimera_private.guard_chapter_creator() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_owner uuid; v_choice jsonb; v_target uuid;
BEGIN
 IF current_user IN('anon','authenticated') THEN
  IF TG_OP='UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.story_id IS DISTINCT FROM OLD.story_id OR NEW.created_at IS DISTINCT FROM OLD.created_at) THEN RAISE EXCEPTION 'Chapter identity is immutable'; END IF;
  SELECT user_id INTO v_owner FROM public.stories WHERE id=NEW.story_id;
  IF v_owner IS DISTINCT FROM auth.uid() AND (NEW.status<>'draft' OR (TG_OP='UPDATE' AND (NEW.published_at IS DISTINCT FROM OLD.published_at OR OLD.status<>'draft'))) THEN RAISE EXCEPTION 'Only the creator publishes chapters'; END IF;
  IF jsonb_typeof(NEW.choices)<>'array' OR jsonb_array_length(NEW.choices)>40 THEN RAISE EXCEPTION 'Invalid chapter choices'; END IF;
  FOR v_choice IN SELECT * FROM jsonb_array_elements(NEW.choices) LOOP
   IF jsonb_typeof(v_choice)<>'object' OR char_length(coalesce(v_choice->>'text','')) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Each choice needs a label'; END IF;
   IF nullif(v_choice->>'target_chapter_id','') IS NOT NULL THEN
    v_target:=(v_choice->>'target_chapter_id')::uuid;
    IF NOT EXISTS(SELECT 1 FROM public.story_chapters WHERE id=v_target AND story_id=NEW.story_id) THEN RAISE EXCEPTION 'Choice destinations must belong to this story'; END IF;
   END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chimera_chapter_creator ON public.story_chapters;
CREATE TRIGGER chimera_chapter_creator BEFORE INSERT OR UPDATE ON public.story_chapters FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_chapter_creator();
REVOKE ALL ON FUNCTION chimera_private.guard_chapter_creator() FROM PUBLIC;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS world_id uuid REFERENCES public.worlds(id) ON DELETE SET NULL;
ALTER TABLE public.worlds ADD COLUMN IF NOT EXISTS canvas_layout jsonb NOT NULL DEFAULT '{"positions":{},"connections":[]}',ADD COLUMN IF NOT EXISTS canvas_revision bigint NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.save_chimera_world_canvas(p_world_id uuid,p_expected_revision bigint,p_layout jsonb) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision bigint; v_id text; v_link jsonb;
BEGIN
 IF NOT public.can_access_chimera_project('world',p_world_id,true) OR pg_column_size(p_layout)>100000 OR jsonb_typeof(p_layout->'positions') IS DISTINCT FROM 'object' OR jsonb_typeof(p_layout->'connections') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'World editor permission and a valid layout required'; END IF;
 FOR v_id IN SELECT jsonb_object_keys(p_layout->'positions') LOOP
  IF NOT EXISTS(SELECT 1 FROM public.world_locations WHERE id::text=v_id AND world_id=p_world_id UNION ALL SELECT 1 FROM public.world_factions WHERE id::text=v_id AND world_id=p_world_id) THEN RAISE EXCEPTION 'Layout nodes must reference this world'; END IF;
  IF jsonb_typeof(p_layout->'positions'->v_id->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(p_layout->'positions'->v_id->'y') IS DISTINCT FROM 'number' OR abs((p_layout->'positions'->v_id->>'x')::numeric)>2000 OR abs((p_layout->'positions'->v_id->>'y')::numeric)>2000 THEN RAISE EXCEPTION 'Invalid node position'; END IF;
 END LOOP;
 FOR v_link IN SELECT * FROM jsonb_array_elements(p_layout->'connections') LOOP
  IF jsonb_typeof(v_link) IS DISTINCT FROM 'object' OR jsonb_typeof(v_link->'id') IS DISTINCT FROM 'string' OR NOT coalesce(p_layout->'positions' ? (v_link->>'fromId'),false) OR NOT coalesce(p_layout->'positions' ? (v_link->>'toId'),false) OR (v_link ? 'label' AND jsonb_typeof(v_link->'label') NOT IN('string','null')) OR char_length(coalesce(v_link->>'label',''))>200 THEN RAISE EXCEPTION 'Connections must reference placed world nodes'; END IF;
 END LOOP;
 UPDATE public.worlds SET canvas_layout=p_layout,canvas_revision=canvas_revision+1 WHERE id=p_world_id AND canvas_revision=p_expected_revision RETURNING canvas_revision INTO v_revision;
 IF NOT FOUND THEN RAISE EXCEPTION 'World layout changed; compare before saving'; END IF;
 RETURN v_revision;
END; $$;
CREATE OR REPLACE FUNCTION chimera_private.guard_world_canvas() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN('anon','authenticated') THEN
  IF TG_OP='INSERT' THEN
   IF NEW.canvas_revision<>0 OR NEW.canvas_layout IS DISTINCT FROM '{"positions":{},"connections":[]}'::jsonb THEN RAISE EXCEPTION 'New world layouts start empty; use the authorized world operation'; END IF;
   RETURN NEW;
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.canvas_layout IS DISTINCT FROM OLD.canvas_layout OR NEW.canvas_revision IS DISTINCT FROM OLD.canvas_revision OR NEW.name IS DISTINCT FROM OLD.name OR NEW.description IS DISTINCT FROM OLD.description OR NEW.scenario IS DISTINCT FROM OLD.scenario OR NEW.tags IS DISTINCT FROM OLD.tags OR NEW.cover_url IS DISTINCT FROM OLD.cover_url OR NEW.visibility IS DISTINCT FROM OLD.visibility THEN RAISE EXCEPTION 'Use the authorized world operation'; END IF;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chimera_world_canvas ON public.worlds;
CREATE TRIGGER chimera_world_canvas BEFORE INSERT OR UPDATE ON public.worlds FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_world_canvas();
REVOKE ALL ON FUNCTION chimera_private.guard_world_canvas() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_chimera_world_canvas(uuid,bigint,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_chimera_world_canvas(uuid,bigint,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION chimera_private.guard_world_entity() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN('anon','authenticated') AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.world_id IS DISTINCT FROM OLD.world_id) THEN RAISE EXCEPTION 'World entity identity is immutable'; END IF; RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION chimera_private.guard_world_entity() FROM PUBLIC;
DO $$DECLARE v_table text; BEGIN
 FOREACH v_table IN ARRAY ARRAY['world_locations','world_factions','world_timeline_events'] LOOP
  EXECUTE format('DROP POLICY IF EXISTS chimera_world_editor_read ON public.%I',v_table);
  EXECUTE format('CREATE POLICY chimera_world_editor_read ON public.%I FOR SELECT TO authenticated USING(public.can_access_chimera_project(''world'',world_id))',v_table);
  EXECUTE format('DROP POLICY IF EXISTS chimera_world_editor_insert ON public.%I',v_table);
  EXECUTE format('CREATE POLICY chimera_world_editor_insert ON public.%I FOR INSERT TO authenticated WITH CHECK(public.can_access_chimera_project(''world'',world_id,true))',v_table);
  EXECUTE format('DROP POLICY IF EXISTS chimera_world_editor_update ON public.%I',v_table);
  EXECUTE format('CREATE POLICY chimera_world_editor_update ON public.%I FOR UPDATE TO authenticated USING(public.can_access_chimera_project(''world'',world_id,true)) WITH CHECK(public.can_access_chimera_project(''world'',world_id,true))',v_table);
  EXECUTE format('DROP TRIGGER IF EXISTS chimera_world_entity_identity ON public.%I',v_table);
  EXECUTE format('CREATE TRIGGER chimera_world_entity_identity BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_world_entity()',v_table);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.save_chimera_world_overview(p_world_id uuid,p_expected_updated_at timestamptz,p_fields jsonb) RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_world public.worlds; v_updated timestamptz;
BEGIN
 IF NOT public.can_access_chimera_project('world',p_world_id,true) THEN RAISE EXCEPTION 'World editor permission required'; END IF;
 SELECT * INTO v_world FROM public.worlds WHERE id=p_world_id FOR UPDATE;
 IF v_world.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'World changed; compare before saving'; END IF;
 IF char_length(coalesce(p_fields->>'name','')) NOT BETWEEN 1 AND 200 OR pg_column_size(p_fields)>100000 THEN RAISE EXCEPTION 'Invalid world details'; END IF;
 IF p_fields->>'visibility' IS DISTINCT FROM v_world.visibility AND v_world.user_id<>auth.uid() THEN RAISE EXCEPTION 'Only the creator changes visibility'; END IF;
 IF p_fields->>'visibility' NOT IN('public','private','unlisted') THEN RAISE EXCEPTION 'Invalid visibility'; END IF;
 UPDATE public.worlds SET name=p_fields->>'name',description=coalesce(p_fields->>'description',''),scenario=coalesce(p_fields->>'scenario',''),tags=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_fields->'tags','[]'::jsonb))),cover_url=nullif(p_fields->>'cover_url',''),visibility=p_fields->>'visibility',updated_at=clock_timestamp() WHERE id=p_world_id RETURNING updated_at INTO v_updated;
 RETURN v_updated;
END; $$;
REVOKE ALL ON FUNCTION public.save_chimera_world_overview(uuid,timestamptz,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_chimera_world_overview(uuid,timestamptz,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION chimera_private.guard_story_world_link() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN('anon','authenticated') AND NEW.world_id IS NOT NULL THEN
  IF TG_OP='INSERT' THEN
   IF NOT public.can_access_chimera_project('world',NEW.world_id) THEN RAISE EXCEPTION 'World permission required'; END IF;
  ELSIF NEW.world_id IS DISTINCT FROM OLD.world_id AND NOT public.can_access_chimera_project('world',NEW.world_id) THEN RAISE EXCEPTION 'World permission required'; END IF;
 END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS chimera_story_world_link ON public.stories;
CREATE TRIGGER chimera_story_world_link BEFORE INSERT OR UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_story_world_link();
REVOKE ALL ON FUNCTION chimera_private.guard_story_world_link() FROM PUBLIC;
-- Reveal invitation metadata only to the addressed person, before access is accepted.
CREATE OR REPLACE FUNCTION public.get_my_chimera_project_invitations()
RETURNS TABLE(id uuid,project_type text,project_id uuid,role text,project_title text,inviter_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT c.id,c.project_type,c.project_id,c.role,coalesce(s.title,w.name),p.display_name
 FROM public.project_collaborators c
 LEFT JOIN public.stories s ON c.project_type='story' AND s.id=c.project_id
 LEFT JOIN public.worlds w ON c.project_type='world' AND w.id=c.project_id
 JOIN public.profiles p ON p.user_id=c.invited_by
 WHERE auth.uid() IS NOT NULL AND c.user_id=auth.uid() AND c.status='pending' AND chimera_private.project_owner(c.project_type,c.project_id)=c.invited_by;
$$;
REVOKE ALL ON FUNCTION public.get_my_chimera_project_invitations() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_chimera_project_invitations() TO authenticated;
COMMIT;
