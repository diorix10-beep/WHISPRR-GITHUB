-- Migration: 031_v4_ai_chat_response_rpc.sql
-- Description: Creates a SECURITY DEFINER function to allow authenticated users to trigger AI bot responses securely without exposing service role keys.

CREATE OR REPLACE FUNCTION public.respond_as_ai_character(
  p_conversation_id uuid,
  p_bot_id uuid,
  p_content text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Verify that the invoking user is a participant in the conversation
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to post in this conversation';
  END IF;

  -- Verify that p_bot_id is indeed a participant in the conversation
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = p_bot_id
  ) THEN
    RAISE EXCEPTION 'Bot is not a participant in this conversation';
  END IF;

  -- Insert the message on behalf of the bot
  INSERT INTO public.messages (conversation_id, sender_id, content, read)
  VALUES (p_conversation_id, p_bot_id, p_content, false);

  -- Update conversation last message
  UPDATE public.conversations
  SET 
    last_message = p_content,
    last_message_at = now()
  WHERE id = p_conversation_id;
END;
$$;
