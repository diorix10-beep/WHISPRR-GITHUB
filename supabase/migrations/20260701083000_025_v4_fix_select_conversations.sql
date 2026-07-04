-- Migration: 025_v4_fix_select_conversations.sql
-- Description: Fixes the select_conversations policy to allow the creator to see the conversation.
-- This resolves the RLS chicken-and-egg insert conflict.

DROP POLICY IF EXISTS "select_conversations" ON public.conversations;
CREATE POLICY "select_conversations" ON public.conversations FOR SELECT TO public
USING (
  auth.uid() IS NOT NULL AND
  (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = conversations.id 
      AND user_id = auth.uid()
    )
  )
);
