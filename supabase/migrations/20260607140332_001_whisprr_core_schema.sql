/*
# WHISPRR Schema Part 1 - Core tables

Creates base tables without cross-references that would fail due to ordering.

1. New Tables
- `profiles`: User profiles
- `communities`: Interest-based communities (simplified policies for now)
- `whispers`: User posts
- `reactions`: Reactions on whispers
- `comments`: Comments on whispers
- `follows`: Follow relationships
- `notifications`: User notifications
- `voice_rooms`: Voice rooms

2. Security
- RLS enabled on all tables
- Basic owner-scoped policies
- Communities: simplified policies (will be updated in part 2)
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text NOT NULL DEFAULT '',
  username text UNIQUE,
  avatar_emoji text NOT NULL DEFAULT '💫',
  photo_url text,
  bio text DEFAULT '',
  mood text,
  interests text[] DEFAULT '{}',
  location text,
  birthday date,
  website text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  profile_visible boolean NOT NULL DEFAULT true,
  online_status_visible boolean NOT NULL DEFAULT true,
  read_receipts_enabled boolean NOT NULL DEFAULT true,
  who_can_message text NOT NULL DEFAULT 'everyone' CHECK (who_can_message IN ('everyone', 'followers', 'no_one')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- COMMUNITIES
CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  interest text NOT NULL,
  emoji text NOT NULL DEFAULT '🌍',
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_communities" ON communities;
CREATE POLICY "select_communities" ON communities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_communities" ON communities;
CREATE POLICY "insert_communities" ON communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_community_owner" ON communities;
CREATE POLICY "update_community_owner" ON communities FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_community_owner" ON communities;
CREATE POLICY "delete_community_owner" ON communities FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- COMMUNITY MEMBERS
CREATE TABLE IF NOT EXISTS community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_community_members" ON community_members;
CREATE POLICY "select_community_members" ON community_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_community_member" ON community_members;
CREATE POLICY "insert_own_community_member" ON community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_community_member_roles" ON community_members;
CREATE POLICY "update_community_member_roles" ON community_members FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = community_members.community_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "delete_own_community_member" ON community_members;
CREATE POLICY "delete_own_community_member" ON community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WHISPERS
CREATE TABLE IF NOT EXISTS whispers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  mood text,
  community_id uuid REFERENCES communities(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES whispers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE whispers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_whispers" ON whispers;
CREATE POLICY "select_whispers" ON whispers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_whisper" ON whispers;
CREATE POLICY "insert_own_whisper" ON whispers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_whisper" ON whispers;
CREATE POLICY "update_own_whisper" ON whispers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_whisper" ON whispers;
CREATE POLICY "delete_own_whisper" ON whispers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- REACTIONS
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whisper_id uuid NOT NULL REFERENCES whispers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('felt', 'warmth', 'spark')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(whisper_id, user_id, type)
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_reactions" ON reactions;
CREATE POLICY "select_reactions" ON reactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_reaction" ON reactions;
CREATE POLICY "insert_own_reaction" ON reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reaction" ON reactions;
CREATE POLICY "delete_own_reaction" ON reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whisper_id uuid NOT NULL REFERENCES whispers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_comments" ON comments;
CREATE POLICY "select_comments" ON comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_comment" ON comments;
CREATE POLICY "insert_own_comment" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_comment" ON comments;
CREATE POLICY "update_own_comment" ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_comment" ON comments;
CREATE POLICY "delete_own_comment" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FOLLOWS
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_follows" ON follows;
CREATE POLICY "select_follows" ON follows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_follow" ON follows;
CREATE POLICY "insert_own_follow" ON follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id AND auth.uid() != following_id);

DROP POLICY IF EXISTS "delete_own_follow" ON follows;
CREATE POLICY "delete_own_follow" ON follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'dm' CHECK (type IN ('dm', 'group')),
  name text,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CONVERSATION PARTICIPANTS
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_conversations" ON conversations;
CREATE POLICY "select_conversations" ON conversations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_conversations" ON conversations;
CREATE POLICY "insert_conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_conversations" ON conversations;
CREATE POLICY "update_conversations" ON conversations FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid())
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_conversation_participants" ON conversation_participants;
CREATE POLICY "select_conversation_participants" ON conversation_participants FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_conversation_participants" ON conversation_participants;
CREATE POLICY "insert_conversation_participants" ON conversation_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_conversation_participants" ON conversation_participants;
CREATE POLICY "delete_conversation_participants" ON conversation_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_messages" ON messages;
CREATE POLICY "select_messages" ON messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_own_message" ON messages;
CREATE POLICY "insert_own_message" ON messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "update_messages_read" ON messages;
CREATE POLICY "update_messages_read" ON messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('follow', 'reaction', 'comment', 'mention', 'message')),
  reference_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- VOICE ROOMS
CREATE TABLE IF NOT EXISTS voice_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE SET NULL,
  name text NOT NULL,
  host_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  participant_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE voice_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_voice_rooms" ON voice_rooms;
CREATE POLICY "select_voice_rooms" ON voice_rooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_voice_room" ON voice_rooms;
CREATE POLICY "insert_own_voice_room" ON voice_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "update_own_voice_room" ON voice_rooms;
CREATE POLICY "update_own_voice_room" ON voice_rooms FOR UPDATE TO authenticated USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "delete_own_voice_room" ON voice_rooms;
CREATE POLICY "delete_own_voice_room" ON voice_rooms FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_whispers_user_id ON whispers(user_id);
CREATE INDEX IF NOT EXISTS idx_whispers_community_id ON whispers(community_id);
CREATE INDEX IF NOT EXISTS idx_whispers_parent_id ON whispers(parent_id);
CREATE INDEX IF NOT EXISTS idx_whispers_created_at ON whispers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_whisper_id ON reactions(whisper_id);
CREATE INDEX IF NOT EXISTS idx_comments_whisper_id ON comments(whisper_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
