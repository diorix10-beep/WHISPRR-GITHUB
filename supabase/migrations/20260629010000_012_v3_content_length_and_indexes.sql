-- WHISPRR V3 Migration: Ensure content columns support long-form text
-- PostgreSQL text type has no length limit, but run this to be safe
-- and confirm VARCHAR columns are updated to TEXT

-- Whispers content: 5,000 characters minimum
ALTER TABLE whispers ALTER COLUMN content TYPE text;

-- Comments content: 5,000 characters minimum  
ALTER TABLE comments ALTER COLUMN content TYPE text;

-- Messages content: 5,000 characters minimum
ALTER TABLE messages ALTER COLUMN content TYPE text;

-- Add index on whispers for faster feed queries
CREATE INDEX IF NOT EXISTS idx_whispers_created_at ON whispers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whispers_mood ON whispers(mood);
CREATE INDEX IF NOT EXISTS idx_whispers_community ON whispers(community_id);

-- Add index on messages for faster conversation loading
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at ASC);

-- Add index on reactions for faster counting
CREATE INDEX IF NOT EXISTS idx_reactions_whisper ON reactions(whisper_id, type);
