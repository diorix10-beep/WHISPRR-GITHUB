-- Migration: 015_v3_fix_messaging_rls.sql
-- Description: Relaxes INSERT RLS policies on conversations and conversation_participants to allow starting chats.

-- 1. Relax INSERT policy on conversations to allow any authenticated user to initialize a chat shell
DROP POLICY IF EXISTS "insert_conversations" ON conversations;
CREATE POLICY "insert_conversations" ON conversations FOR INSERT TO authenticated
WITH CHECK (true);

-- 2. Relax INSERT policy on conversation_participants to allow adding members (e.g. starting a DM or group chat)
DROP POLICY IF EXISTS "insert_conversation_participants" ON conversation_participants;
CREATE POLICY "insert_conversation_participants" ON conversation_participants FOR INSERT TO authenticated
WITH CHECK (true);
