-- Step 1: Add Wellness Columns to Profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS wellness_break_reminders_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS wellness_break_frequency_minutes integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS wellness_quiet_hours_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS wellness_quiet_hours_start text DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS wellness_quiet_hours_end text DEFAULT '08:00';

-- Step 2: Create User Blocks Table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_blocks" ON public.user_blocks;
CREATE POLICY "select_own_blocks" ON public.user_blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "insert_own_blocks" ON public.user_blocks;
CREATE POLICY "insert_own_blocks" ON public.user_blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "delete_own_blocks" ON public.user_blocks;
CREATE POLICY "delete_own_blocks" ON public.user_blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- Step 3: Create User Mutes Table
CREATE TABLE IF NOT EXISTS public.user_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  muter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(muter_id, muted_id)
);

ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mutes" ON public.user_mutes;
CREATE POLICY "select_own_mutes" ON public.user_mutes
  FOR SELECT TO authenticated USING (auth.uid() = muter_id);

DROP POLICY IF EXISTS "insert_own_mutes" ON public.user_mutes;
CREATE POLICY "insert_own_mutes" ON public.user_mutes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = muter_id);

DROP POLICY IF EXISTS "delete_own_mutes" ON public.user_mutes;
CREATE POLICY "delete_own_mutes" ON public.user_mutes
  FOR DELETE TO authenticated USING (auth.uid() = muter_id);

-- Step 4: Create Content & User Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('whisper', 'comment', 'user')),
  content_id uuid,
  reason text NOT NULL,
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reports" ON public.reports;
CREATE POLICY "select_own_reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "insert_own_report" ON public.reports;
CREATE POLICY "insert_own_report" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Step 5: Add Pinning & Soft Removal to Whispers & Comments
ALTER TABLE public.whispers 
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_removed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS removed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS removed_at timestamptz;

ALTER TABLE public.comments 
  ADD COLUMN IF NOT EXISTS is_removed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS removed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS removed_at timestamptz;

-- Policy: Community moderators can update whispers to Pin/Remove them
DROP POLICY IF EXISTS "update_community_whisper_moderators" ON public.whispers;
CREATE POLICY "update_community_whisper_moderators" ON public.whispers 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members 
      WHERE community_id = whispers.community_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_members 
      WHERE community_id = whispers.community_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'moderator')
    )
  );

-- Policy: Community moderators can update comments to Remove them
DROP POLICY IF EXISTS "update_community_comment_moderators" ON public.comments;
CREATE POLICY "update_community_comment_moderators" ON public.comments 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.whispers w
      JOIN public.community_members m ON w.community_id = m.community_id
      WHERE w.id = comments.whisper_id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('owner', 'admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whispers w
      JOIN public.community_members m ON w.community_id = m.community_id
      WHERE w.id = comments.whisper_id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('owner', 'admin', 'moderator')
    )
  );

-- Step 6: Update Check Constraints for Collaboration Roles & Notification Types
ALTER TABLE public.community_collaborations 
  DROP CONSTRAINT IF EXISTS community_collaborations_role_needed_check;

ALTER TABLE public.community_collaborations 
  ADD CONSTRAINT community_collaborations_role_needed_check 
  CHECK (role_needed IN ('writer', 'editor', 'prompt_engineer', 'character_designer', 'worldbuilder', 'lore_writer', 'voice_actor', 'collaborator'));

ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('follow', 'reaction', 'comment', 'mention', 'message', 'collaboration_invitation', 'collaboration_application'));
