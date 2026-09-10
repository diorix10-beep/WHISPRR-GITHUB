-- Reconcile objects found in the verified 2026-08-21 WHISPRR backup but
-- absent from the repository's historical migration chain. All changes are
-- additive and idempotent so production can review this migration later.

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_image_url text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'unlisted', 'public')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS project_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'personas_project_id_fkey'
      AND conrelid = 'public.personas'::regclass
  ) THEN
    ALTER TABLE public.personas
      ADD CONSTRAINT personas_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_projects_creator ON public.projects(creator_id);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_own_projects ON public.projects;
CREATE POLICY select_own_projects ON public.projects FOR SELECT TO authenticated
  USING ((select auth.uid()) = creator_id);
DROP POLICY IF EXISTS insert_own_projects ON public.projects;
CREATE POLICY insert_own_projects ON public.projects FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = creator_id);
DROP POLICY IF EXISTS update_own_projects ON public.projects;
CREATE POLICY update_own_projects ON public.projects FOR UPDATE TO authenticated
  USING ((select auth.uid()) = creator_id)
  WITH CHECK ((select auth.uid()) = creator_id);
DROP POLICY IF EXISTS delete_own_projects ON public.projects;
CREATE POLICY delete_own_projects ON public.projects FOR DELETE TO authenticated
  USING ((select auth.uid()) = creator_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.chat_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_thread_members (
  chat_thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (chat_thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_created_by ON public.chat_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_thread_members_user_id ON public.chat_thread_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created_at
  ON public.chat_messages(chat_thread_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.chat_is_member(p_chat_thread_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_thread_members
    WHERE chat_thread_id = p_chat_thread_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.chat_is_owner(p_chat_thread_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_thread_members
    WHERE chat_thread_id = p_chat_thread_id
      AND user_id = p_user_id
      AND role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.chat_touch_thread_on_message()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_threads
  SET updated_at = now(), last_message_at = now()
  WHERE id = NEW.chat_thread_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_is_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_is_owner(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_touch_thread_on_message() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_is_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.chat_is_owner(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.chat_touch_thread_on_message() TO service_role;

DROP TRIGGER IF EXISTS on_chat_message_created ON public.chat_messages;
CREATE TRIGGER on_chat_message_created
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_touch_thread_on_message();

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat users can create threads" ON public.chat_threads;
CREATE POLICY "chat users can create threads" ON public.chat_threads FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);
DROP POLICY IF EXISTS "chat members can view threads" ON public.chat_threads;
CREATE POLICY "chat members can view threads" ON public.chat_threads FOR SELECT TO authenticated
  USING (public.chat_is_member(id, (select auth.uid())));
DROP POLICY IF EXISTS "chat owners can update threads" ON public.chat_threads;
CREATE POLICY "chat owners can update threads" ON public.chat_threads FOR UPDATE TO authenticated
  USING (public.chat_is_owner(id, (select auth.uid())))
  WITH CHECK (public.chat_is_owner(id, (select auth.uid())));

DROP POLICY IF EXISTS "chat users can insert own profile" ON public.chat_profiles;
CREATE POLICY "chat users can insert own profile" ON public.chat_profiles FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);
DROP POLICY IF EXISTS "chat users can view own profile" ON public.chat_profiles;
CREATE POLICY "chat users can view own profile" ON public.chat_profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "chat users can update own profile" ON public.chat_profiles;
CREATE POLICY "chat users can update own profile" ON public.chat_profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "chat members can view members" ON public.chat_thread_members;
CREATE POLICY "chat members can view members" ON public.chat_thread_members FOR SELECT TO authenticated
  USING (public.chat_is_member(chat_thread_id, (select auth.uid())));
DROP POLICY IF EXISTS "chat owners can add members" ON public.chat_thread_members;
CREATE POLICY "chat owners can add members" ON public.chat_thread_members FOR INSERT TO authenticated
  WITH CHECK (public.chat_is_owner(chat_thread_id, (select auth.uid())));

DROP POLICY IF EXISTS "chat members can view messages" ON public.chat_messages;
CREATE POLICY "chat members can view messages" ON public.chat_messages FOR SELECT TO authenticated
  USING (public.chat_is_member(chat_thread_id, (select auth.uid())));
DROP POLICY IF EXISTS "chat members can send messages" ON public.chat_messages;
CREATE POLICY "chat members can send messages" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND public.chat_is_member(chat_thread_id, (select auth.uid()))
  );

GRANT SELECT, INSERT, UPDATE ON public.chat_threads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chat_profiles TO authenticated;
GRANT SELECT, INSERT ON public.chat_thread_members TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_threads, public.chat_profiles,
  public.chat_thread_members, public.chat_messages TO service_role;
