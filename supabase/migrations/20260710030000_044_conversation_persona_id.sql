-- Add persona_id to conversation_participants
-- This allows users to select which persona they're roleplaying as per conversation.
-- The AI chat API uses this to inject persona context into the system prompt.

ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL;

-- Allow users to update their own participant row (to set/change persona_id)
DROP POLICY IF EXISTS "update_conversation_participants" ON public.conversation_participants;
CREATE POLICY "update_conversation_participants" ON public.conversation_participants
  FOR UPDATE TO public
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
