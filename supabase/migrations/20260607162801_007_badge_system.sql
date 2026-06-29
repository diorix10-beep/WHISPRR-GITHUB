-- Add badges column to profiles (text array, expandable for future badges)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}';

-- Create index for badge queries
CREATE INDEX IF NOT EXISTS idx_profiles_badges ON profiles USING GIN (badges);
