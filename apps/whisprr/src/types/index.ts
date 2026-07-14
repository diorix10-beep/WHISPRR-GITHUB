export type BadgeType = 
  | 'founder' 
  | 'admin'
  | 'early_supporter'
  | 'community_creator' 
  | 'community_moderator'
  | 'verified'
  | 'top_contributor' 
  | 'verified_org' 
  | 'verified_creator' 
  | 'ambassador' 
  | 'beta_tester' 
  | 'event_host' 
  | 'community_champion' 
  | 'mentor' 
  | 'translator' 
  | 'volunteer' 
  | 'featured_creator';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  avatar_emoji: string;
  photo_url: string | null;
  bio: string | null;
  mood: string | null;
  interests: string[];
  badges: BadgeType[];
  location: string | null;
  birthday: string | null;
  website: string | null;
  onboarding_complete: boolean;
  profile_visible: boolean;
  online_status_visible: boolean;
  read_receipts_enabled: boolean;
  who_can_message: 'everyone' | 'followers' | 'no_one';
  role: 'founder' | 'admin' | 'moderator' | 'user' | 'ai_character';
  created_at: string;
  updated_at: string;
  banner_url?: string | null;
  pronouns?: string | null;
  languages?: string[];
  social_links?: Record<string, string>;
  currently_building?: string | null;
  creator_role_1?: string | null;
  creator_role_2?: string | null;
  personality_badges?: string[];
  pinned_whisper_id?: string | null;
  featured_communities?: string[];
  favorites?: Record<string, string>;
  personal_values?: string[];
  looking_for?: string[];
  field_privacy?: Record<string, 'public' | 'followers' | 'private'>;
  muted_interests?: string[];
  muted_communities?: string[];
  referrals_count?: number;
  referred_by?: string | null;
  home_country?: string;
  legal_accepted_version?: string | null;
  legal_accepted_at?: string | null;
  legal_accepted_ip?: string | null;
  access_level?: 'whisprr' | 'chimera' | 'ecosystem';
}

export interface UserViolation {
  id: string;
  user_id: string;
  rule_violated: string;
  violated_section_link: string;
  violation_level: number;
  description: string;
  acknowledged: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Whisper {
  id: string;
  user_id: string;
  content: string;
  mood: string | null;
  community_id: string | null;
  parent_id: string | null;
  created_at: string;
  profiles?: Profile;
  reactions?: Reaction[];
  comment_count?: number;
  is_pinned?: boolean;
  is_removed?: boolean;
  removed_by?: string | null;
  removed_at?: string | null;
}

export interface Reaction {
  id: string;
  whisper_id: string;
  user_id: string;
  type: 'felt' | 'warmth' | 'spark';
  created_at: string;
}

export interface Comment {
  id: string;
  whisper_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  read: boolean;
  deleted_at: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  participants: string[];
  created_by: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'follow' | 'reaction' | 'comment' | 'mention' | 'message';
  reference_id: string | null;
  read: boolean;
  created_at: string;
  actor_profile?: Profile;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  interest: string;
  emoji: string;
  owner_id: string;
  banner_url: string | null;
  rules: string[];
  category: string;
  is_featured: boolean;
  last_activity_at: string | null;
  post_count: number;
  created_at: string;
  member_count?: number;
  community_members?: CommunityMember[];
}

export const COMMUNITY_CATEGORIES = [
  'General', 'Music', 'Gaming', 'Art & Design', 'Technology',
  'Sports & Fitness', 'Food & Drink', 'Travel', 'Books & Writing',
  'Film & TV', 'Photography', 'Fashion & Beauty', 'Science',
  'Business', 'Education', 'Lifestyle', 'Memes & Humor',
  'Pets & Animals', 'Health & Wellness', 'Social',
] as const;

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface VoiceRoom {
  id: string;
  community_id: string | null;
  name: string;
  host_id: string;
  active: boolean;
  participant_count: number;
  created_at: string;
}

export const MOODS = [
  'Happy', 'Calm', 'Grateful', 'Hopeful', 'Curious',
  'Reflective', 'Creative', 'Excited', 'Nostalgic', 'Peaceful',
  'Adventurous', 'Cozy', 'Dreamy', 'Empowered', 'Joyful',
  'Sad', 'Anxious', 'Lonely', 'Tired', 'Frustrated',
] as const;

export const INTERESTS = [
  'Music', 'Movies', 'TV Shows', 'Gaming', 'Technology',
  'Fitness', 'Sports', 'Travel', 'Photography', 'Fashion',
  'Food', 'Cooking', 'Coffee', 'Art', 'Books',
  'Writing', 'Animals', 'Nature', 'Cars', 'Motorcycles',
  'Business', 'Entrepreneurship', 'Content Creation', 'Social Media', 'Dating',
  'Friendship', 'Nightlife', 'Festivals', 'Anime', 'Comics',
  'K-Pop', 'Dancing', 'Languages', 'Shopping', 'Beauty',
  'Self Improvement', 'Education',
] as const;

export type Mood = typeof MOODS[number];
export type Interest = typeof INTERESTS[number];

export const PERSONALITY_BADGES = [
  '🌙 Calm',
  '✨ Dreamer',
  '☕ Night Owl',
  '🎧 Music Lover',
  '📚 Curious',
  '🎮 Gamer',
  '💜 Empathetic',
  '🌱 Optimistic',
  '🌊 Introvert',
  '🌞 Early Bird',
  '🎨 Creative',
  '✈️ Explorer',
  '🧘 Mindful',
  '💡 Innovator',
  '🌱 Plant Parent',
  '🍳 Foodie',
  '🏋️ Fitness Fanatic',
  '🎬 Film Buff'
] as const;

export type PersonalityBadge = typeof PERSONALITY_BADGES[number];

export const PERSONAL_VALUES = [
  'Kindness',
  'Honesty',
  'Curiosity',
  'Growth',
  'Respect',
  'Creativity',
  'Humor',
  'Adventure'
] as const;

export type PersonalValue = typeof PERSONAL_VALUES[number];

export const LOOKING_FOR_OPTIONS = [
  'New Friends',
  'Meaningful Conversations',
  'Study Partners',
  'Language Exchange',
  'Gaming Friends',
  'Creative Collaborators',
  'Networking'
] as const;

export type LookingForOption = typeof LOOKING_FOR_OPTIONS[number];

export interface CommunityCollaboration {
  id: string;
  community_id: string;
  user_id: string;
  role_needed: 'writer' | 'editor' | 'prompt_engineer' | 'voice_actor' | 'collaborator';
  title: string;
  description: string;
  created_at: string;
  profiles?: Profile;
}

export interface CommunityFeatured {
  id: string;
  community_id: string;
  user_id: string;
  asset_type: 'character' | 'story' | 'world' | 'lorebook';
  asset_id: string;
  title: string;
  description: string;
  created_at: string;
  profiles?: Profile;
}

export interface CommunityEvent {
  id: string;
  community_id: string;
  title: string;
  description: string;
  event_type: 'writing_challenge' | 'creator_event' | 'contest' | 'collaboration_week';
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
  profiles?: Profile;
}

