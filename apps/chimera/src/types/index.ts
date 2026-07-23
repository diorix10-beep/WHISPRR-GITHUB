// ============================================================
// CHIMERA — Platform Type Definitions
// AI Creation Platform types, separated from WHISPRR social types
// ============================================================

// ── Core Platform Types ─────────────────────────────────────

export type ChimeraRole = 'creator' | 'reader' | 'admin';

export type ProjectType = 'character' | 'world' | 'story' | 'collection';

export type Visibility = 'public' | 'private' | 'unlisted';

export type ContentStatus = 'draft' | 'published' | 'archived';

// ── Projects ────────────────────────────────────────────────

export interface ChimeraProject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  cover_url: string | null;
  project_type: ProjectType;
  is_archived: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Creator Stats ───────────────────────────────────────────

export interface CreatorStats {
  user_id: string;
  total_characters: number;
  total_worlds: number;
  total_stories: number;
  total_conversations: number;
  total_published: number;
  last_activity_at: string;
  updated_at: string;
}

// ── User Preferences ────────────────────────────────────────

export interface ChimeraUserPreferences {
  user_id: string;
  default_ai_model: string;
  ai_writing_assistant_enabled: boolean;
  theme_preference: 'light' | 'dark' | 'system';
  editor_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Characters ──────────────────────────────────────────────

export interface AiCharacter {
  id: string;
  user_id: string;
  creator_id: string;
  greeting: string;
  short_description: string;
  long_description: string;
  personality: string;
  scenario: string;
  example_dialogues: string;
  conversation_style: string;
  knowledge: string;
  tags: string[];
  category: string;
  visibility: Visibility;
  status?: ContentStatus;
  world_id?: string | null;
  voice_config?: Record<string, unknown>;
  memory_config?: Record<string, unknown>;
  expression_urls?: Record<string, string>;
  outfit_urls?: Record<string, string>;
  ai_provider?: string;
  ai_model?: string;
  ai_config?: Record<string, unknown>;
  chats_count: number;
  likes_count: number;
  followers_count: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profiles?: ChimeraProfile;
}

// ── Worlds ──────────────────────────────────────────────────

export interface World {
  id: string;
  user_id: string;
  name: string;
  description: string;
  scenario: string;
  cover_url?: string | null;
  tags?: string[];
  visibility: Visibility;
  settings?: Record<string, unknown>;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorldLocation {
  id: string;
  world_id: string;
  name: string;
  description: string;
  parent_location_id: string | null;
  image_url: string | null;
  coordinates: Record<string, unknown> | null;
  properties: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorldFaction {
  id: string;
  world_id: string;
  name: string;
  description: string;
  type: string;
  emblem_url: string | null;
  properties: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorldTimelineEvent {
  id: string;
  world_id: string;
  title: string;
  description: string;
  date_label: string | null;
  sort_order: number;
  event_type: string;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface CharacterRelationship {
  id: string;
  world_id: string | null;
  source_character_id: string;
  target_character_id: string;
  relationship_type: string;
  description: string;
  strength: number;
  bidirectional: boolean;
  created_at: string;
}

// ── Lorebooks ───────────────────────────────────────────────

export interface Lorebook {
  id: string;
  user_id: string;
  title: string;
  description: string;
  entry_count: number;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface LorebookEntry {
  id: string;
  lorebook_id: string;
  title: string;
  content: string;
  keywords: string[];
  selective_keys?: string[];
  is_constant?: boolean;
  priority: number;
  enabled: boolean;
  position?: 'before_char' | 'after_char' | 'top_prompt' | 'bottom_prompt';
  case_sensitive?: boolean;
  scan_depth?: number;
  force_active?: boolean;
  insertion_order: number;
  created_at: string;
  updated_at: string;
}

export interface LorebookTriggerResult {
  triggeredEntries: LorebookEntry[];
  compiledPromptText: string;
  matchedKeywordsMap: Record<string, string[]>; // entryId -> matched keywords
}

// ── Stories ──────────────────────────────────────────────────

export interface Story {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  content: string;
  cover_url?: string | null;
  visibility: Visibility;
  genre: string;
  tags: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  shared_to_whisprr: boolean;
  whisprr_whisper_id?: string | null;
  published_at?: string | null;
  scheduled_publish_at?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: ChimeraProfile;
  chapters_count?: number;
  votes_count?: number;
  comments_count?: number;
}

export interface StoryChapter {
  id: string;
  story_id: string;
  title: string;
  content: string;
  chapter_number: number;
  status: 'draft' | 'published';
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryScene {
  id: string;
  chapter_id: string;
  title: string;
  content: string;
  scene_number: number;
  location_id: string | null;
  characters: string[];
  mood: string | null;
  created_at: string;
  updated_at: string;
}

// ── Memory System ───────────────────────────────────────────

export type MemoryType = 'long_term' | 'short_term' | 'personality' | 'relationship' | 'lore';

export interface CharacterMemory {
  id: string;
  character_id: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  importance: number;
  last_accessed_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── AI Models ───────────────────────────────────────────────

export interface AiProvider {
  id: string;
  name: string;
  description: string;
  base_url: string;
  models: AiModel[];
  capabilities: Record<string, boolean>;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface AiModel {
  id: string;
  name: string;
  description: string;
  context_window: number;
  max_output: number;
  supports_streaming: boolean;
  supports_vision: boolean;
  pricing_tier: 'free' | 'standard' | 'premium';
}

export interface UserModelConfig {
  id: string;
  user_id: string;
  provider_id: string;
  model_id: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  custom_parameters: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ── Voices ──────────────────────────────────────────────────

export interface Voice {
  id: string;
  name: string;
  provider: string;
  voice_id: string;
  preview_url: string | null;
  gender: string | null;
  accent: string | null;
  style: string | null;
  tags: string[];
  is_system: boolean;
  created_at: string;
}

export type VoiceType = 'dialogue' | 'narration' | 'inner_thought';

export interface CharacterVoice {
  character_id: string;
  voice_id: string;
  voice_type: VoiceType;
}

// ── Personas (user RP identities) ───────────────────────────

export interface Persona {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string | null;
  tagline?: string | null;
  description?: string | null;
  greeting?: string | null;
  visibility: Visibility;
  base_model: string;
  system_prompt?: string | null;
  gender?: string | null;
  age?: string | number | null;
  pronouns?: string | null;
  occupation?: string | null;
  appearance?: string | null;
  personality?: string | null;
  backstory?: string | null;
  relationships?: string | null;
  tags?: string[];
  is_default?: boolean;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

// ── Conversations ───────────────────────────────────────────

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

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  read: boolean;
  deleted_at: string | null;
  created_at: string;
  profiles?: ChimeraProfile;
}

export interface GroupConversation {
  id: string;
  user_id: string;
  name: string;
  description: string;
  world_id: string | null;
  scenario: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  characters?: AiCharacter[];
}

// ── Profile (CHIMERA-scoped) ────────────────────────────────

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

export interface ChimeraProfile {
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
  role: 'founder' | 'admin' | 'moderator' | 'user' | 'ai_character';
  onboarding_complete: boolean;
  profile_visible: boolean;
  online_status_visible: boolean;
  read_receipts_enabled: boolean;
  who_can_message: 'everyone' | 'followers' | 'no_one';
  banner_url?: string | null;
  pronouns?: string | null;
  languages?: string[];
  social_links?: Record<string, string>;
  personality_badges?: string[];
  personal_values?: string[];
  looking_for?: string[];
  created_at: string;
  updated_at: string;
  // CHIMERA-specific
  access_level?: 'whisprr' | 'chimera' | 'ecosystem';
  legal_accepted_version?: string | null;
  legal_accepted_at?: string | null;
}

// ── Publishing ──────────────────────────────────────────────

export interface ReadingProgress {
  id: string;
  user_id: string;
  story_id: string;
  chapter_id: string | null;
  scroll_position: number;
  progress_percent: number;
  last_read_at: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  target_id: string;
  target_type: 'story' | 'character' | 'world';
  rating: number;
  content: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  target_id: string;
  target_type: 'story' | 'character' | 'world';
  created_at: string;
}

// ── Media Assets ────────────────────────────────────────────

export type AssetType = 'avatar' | 'expression' | 'outfit' | 'scene' | 'location' | 'cover';

export interface MediaAsset {
  id: string;
  user_id: string;
  asset_type: AssetType;
  file_url: string;
  thumbnail_url: string | null;
  prompt: string | null;
  parent_id: string | null;
  parent_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Writing Assistant ───────────────────────────────────────

export type WritingMode = 'manual' | 'assisted';

export interface WritingAssistantConfig {
  user_id: string;
  enabled: boolean;
  mode: WritingMode;
  features_enabled: {
    brainstorming: boolean;
    character_development: boolean;
    lore_expansion: boolean;
    dialogue_suggestions: boolean;
    grammar_style: boolean;
    rewriting: boolean;
    consistency_check: boolean;
    plot_holes: boolean;
    timeline_generation: boolean;
    chapter_organization: boolean;
    scene_transitions: boolean;
  };
  per_project_overrides: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Navigation Module Definitions ───────────────────────────

export interface NavigationModule {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  children?: NavigationModule[];
}

// ── Constants ───────────────────────────────────────────────

export const STORY_GENRES = [
  'Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Mystery',
  'Horror', 'Historical', 'Adventure', 'Drama', 'Slice of Life',
  'Action', 'Comedy', 'Cyberpunk', 'Post-Apocalyptic', 'Non-Fiction',
] as const;

export type StoryGenre = typeof STORY_GENRES[number];

export const CHARACTER_CATEGORIES = [
  'Romance', 'Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Action',
  'Adventure', 'Historical', 'Slice of Life', 'Anime', 'Games',
  'Superheroes', 'School', 'Mafia', 'Royalty', 'Medieval',
  'Cyberpunk', 'Post-Apocalyptic', 'Original Characters (OC)', 'Fandoms',
] as const;

export type CharacterCategory = typeof CHARACTER_CATEGORIES[number];

export const MEMORY_TYPES: MemoryType[] = [
  'long_term', 'short_term', 'personality', 'relationship', 'lore',
];

export const AI_PROVIDERS = [
  { id: 'gemini', name: 'Gemini', icon: '✦' },
  { id: 'claude', name: 'Claude', icon: '◉' },
  { id: 'gpt', name: 'GPT', icon: '◈' },
  { id: 'deepseek', name: 'DeepSeek', icon: '◇' },
] as const;

// ── Backward Compatibility Aliases ──────────────────────────
// These re-export legacy type names used by existing pages.
// Pages should gradually migrate to the new names above.

/** @deprecated Use ChimeraProfile instead */
export type Profile = ChimeraProfile;

/** @deprecated Use ConversationMessage instead */
export type Message = ConversationMessage;

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'follow' | 'reaction' | 'comment' | 'mention' | 'message';
  reference_id: string | null;
  read: boolean;
  created_at: string;
  actor_profile?: ChimeraProfile;
}

export interface StoryLibrary {
  id: string;
  user_id: string;
  story_id: string;
  current_chapter_id?: string | null;
  last_read_at: string;
  created_at: string;
  stories?: Story;
  total_chapters?: number;
  current_chapter_number?: number;
}

export interface StoryComment {
  id: string;
  story_id: string;
  chapter_id?: string | null;
  user_id: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
  profiles?: ChimeraProfile;
  replies?: StoryComment[];
}

export interface StoryVote {
  id: string;
  user_id: string;
  story_id: string;
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
  '🌙 Calm', '✨ Dreamer', '☕ Night Owl', '🎧 Music Lover',
  '📚 Curious', '🎮 Gamer', '💜 Empathetic', '🌱 Optimistic',
  '🌊 Introvert', '🌞 Early Bird', '🎨 Creative', '✈️ Explorer',
  '🧘 Mindful', '💡 Innovator', '🌱 Plant Parent', '🍳 Foodie',
  '🏋️ Fitness Fanatic', '🎬 Film Buff',
] as const;

export type PersonalityBadge = typeof PERSONALITY_BADGES[number];

export const PERSONAL_VALUES = [
  'Kindness', 'Honesty', 'Curiosity', 'Growth',
  'Respect', 'Creativity', 'Humor', 'Adventure',
] as const;

export type PersonalValue = typeof PERSONAL_VALUES[number];

export const LOOKING_FOR_OPTIONS = [
  'New Friends', 'Meaningful Conversations', 'Study Partners',
  'Language Exchange', 'Gaming Friends', 'Creative Collaborators', 'Networking',
] as const;

export type LookingForOption = typeof LOOKING_FOR_OPTIONS[number];

// ── Memory Nexus & Graph Types ─────────────────────────────

export interface MemoryNode {
  id: string;
  conversation_id: string;
  topic: string;
  fact: string;
  category: 'event' | 'fact' | 'relationship' | 'secret' | 'preference';
  recall_weight: number; // 1 to 10 scale
  created_at: string;
  source_message_index?: number;
}

export interface MemoryEdge {
  id: string;
  source_id: string;
  target_id: string;
  label: string;
  strength: number; // 1 to 5 scale
}

export interface MemoryNexusState {
  enabled: boolean;
  recall_strength: number; // 1 to 16 scale (Default = 8)
  nodes: MemoryNode[];
  edges: MemoryEdge[];
  last_extracted_message_count: number;
}

// ── Multi-Character & Chat Modes ───────────────────────────

export type ChatMode = 'one_on_one' | 'group_chat' | 'story_mode' | 'game_mode';

export interface MultiCharacterParticipant {
  character_id: string;
  display_name: string;
  username?: string;
  avatar_emoji?: string;
  photo_url?: string | null;
  personality_summary?: string;
  is_active_speaker?: boolean;
}

export interface RpgChoice {
  id: string;
  key: 'A' | 'B' | 'C' | 'CUSTOM';
  label: string;
  description?: string;
}

export interface RpgGameState {
  current_objective: string;
  progress_percent: number;
  inventory: string[];
  stats: Record<string, number | string>;
  available_choices: RpgChoice[];
  game_over: boolean;
}

