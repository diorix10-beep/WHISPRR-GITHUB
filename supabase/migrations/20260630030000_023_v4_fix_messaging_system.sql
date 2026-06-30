-- Migration: 023_v4_fix_messaging_system.sql
-- Description: Revises messaging RLS policies to allow conversation & participant insertion and enables Supabase Realtime safely.

-- 1. conversations table policies
DROP POLICY IF EXISTS "select_conversations" ON public.conversations;
CREATE POLICY "select_conversations" ON public.conversations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conversations.id 
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_conversations" ON public.conversations;
CREATE POLICY "insert_conversations" ON public.conversations FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "update_conversations" ON public.conversations;
CREATE POLICY "update_conversations" ON public.conversations FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conversations.id 
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "delete_conversations" ON public.conversations;
CREATE POLICY "delete_conversations" ON public.conversations FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conversations.id 
    AND user_id = auth.uid()
  )
);

-- 2. conversation_participants table policies
DROP POLICY IF EXISTS "select_conversation_participants" ON public.conversation_participants;
CREATE POLICY "select_conversation_participants" ON public.conversation_participants FOR SELECT TO authenticated
USING (true); -- No recursion, allows reading mapping details safely

DROP POLICY IF EXISTS "insert_conversation_participants" ON public.conversation_participants;
CREATE POLICY "insert_conversation_participants" ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "delete_conversation_participants" ON public.conversation_participants;
CREATE POLICY "delete_conversation_participants" ON public.conversation_participants FOR DELETE TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND created_by = auth.uid()
  )
);

-- 3. messages table policies
DROP POLICY IF EXISTS "select_messages" ON public.messages;
CREATE POLICY "select_messages" ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = messages.conversation_id 
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_own_message" ON public.messages;
CREATE POLICY "insert_own_message" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = messages.conversation_id 
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "update_messages_read" ON public.messages;
CREATE POLICY "update_messages_read" ON public.messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = messages.conversation_id 
    AND user_id = auth.uid()
  )
);

-- 4. Enable Supabase Realtime safely and idempotently
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add tables to supabase_realtime only if not already members (prevents batch errors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
