-- Migration: 029_v4_fix_messages_profile_fk.sql
-- Description: Establishes a foreign key constraint linking public.messages(sender_id) to public.profiles(user_id)
-- This allows PostgREST to automatically resolve the profiles:sender_id(*) join syntax.

-- Add the foreign key constraint safely
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_profiles_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_profiles_fkey
  FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
