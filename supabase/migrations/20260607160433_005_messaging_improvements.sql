-- Add image_url column to messages for image/file sharing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url text;

-- Add deleted_at column for soft-delete messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add created_by column to conversations for group admin tracking
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow message sender to delete (soft-delete) their own messages
DROP POLICY IF EXISTS "delete_own_message" ON messages;
CREATE POLICY "delete_own_message" ON messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Update insert policy to allow inserting participants for group chats (admin can add)
DROP POLICY IF EXISTS "insert_conversation_participants" ON conversation_participants;
CREATE POLICY "insert_conversation_participants" ON conversation_participants FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

-- Allow group admin to remove participants
DROP POLICY IF EXISTS "delete_conversation_participants" ON conversation_participants;
CREATE POLICY "delete_conversation_participants" ON conversation_participants FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

-- Allow group admin to update conversation name
DROP POLICY IF EXISTS "update_conversations" ON conversations;
CREATE POLICY "update_conversations" ON conversations FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid())
);

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message attachments
DROP POLICY IF EXISTS "message_attachments_upload" ON storage.objects;
CREATE POLICY "message_attachments_upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "message_attachments_read" ON storage.objects;
CREATE POLICY "message_attachments_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'message-attachments');

DROP POLICY IF EXISTS "message_attachments_delete" ON storage.objects;
CREATE POLICY "message_attachments_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
