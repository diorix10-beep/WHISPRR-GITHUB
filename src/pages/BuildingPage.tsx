import { useState } from 'react';
import {
  Rocket, Calendar, GitCommit, Heart, CheckCircle, Clock, Eye,
  FlaskConical, Globe, Sparkles, Stars
} from 'lucide-react';

type RoadmapTab = 'roadmap' | 'changelog' | 'journey' | 'feedback';
type EcosystemStatus = 'released' | 'in_progress' | 'testing' | 'planned' | 'future_vision';

interface RoadmapItem {
  title: string;
  description: string;
  status: EcosystemStatus;
  category: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROADMAP DATA
// ─────────────────────────────────────────────────────────────────────────────
const ROADMAP_ITEMS: RoadmapItem[] = [
  // ── RELEASED ──────────────────────────────────────────────────────────────
  { title: 'Authentication', description: 'Email, Google, and secure session management.', status: 'released', category: 'Core' },
  { title: 'User Profiles', description: 'Rich profiles with bios, interests, moods, and avatars.', status: 'released', category: 'Core' },
  { title: 'Whisper Posts', description: 'Publishing posts with custom emotions and media.', status: 'released', category: 'Core' },
  { title: 'Communities', description: 'Interest-based group spaces with moderator controls.', status: 'released', category: 'Social' },
  { title: 'Direct Messages', description: 'Real-time one-on-one encrypted messaging.', status: 'released', category: 'Social' },
  { title: 'Group Chats', description: 'Collaborative messaging spaces for multiple users.', status: 'released', category: 'Social' },
  { title: 'Notifications', description: 'Real-time alerts for mentions, likes, and messages.', status: 'released', category: 'Core' },
  { title: 'Discovery Engine', description: 'Finding active users, posts, and trending topics.', status: 'released', category: 'Discovery' },

  // ── IN PROGRESS ───────────────────────────────────────────────────────────
  { title: 'Badge & Identity System', description: 'Chronological badges that reflect contribution, history, and trust.', status: 'in_progress', category: 'Trust' },
  { title: 'WHISPRR HQ (Founder Dashboard)', description: 'Central command center for system control, publishing, and analytics.', status: 'in_progress', category: 'Infrastructure' },
  { title: 'Discovery Algorithm', description: 'Interest-graph personalization without addictive patterns.', status: 'in_progress', category: 'Discovery' },
  { title: 'Country Spaces', description: 'Home country priority feeds, local creators, and global exploration.', status: 'in_progress', category: 'Global' },
  { title: 'Public Product Website', description: 'The official home of the WHISPRR project and its story.', status: 'in_progress', category: 'Platform' },
  { title: 'Product Journey', description: 'Transparent timeline of every WHISPRR milestone.', status: 'in_progress', category: 'Platform' },
  { title: 'Public Roadmap', description: 'Live ecosystem roadmap communicating where WHISPRR is going.', status: 'in_progress', category: 'Platform' },
  { title: 'Public Changelog', description: 'Auto-generated updates on every released feature.', status: 'in_progress', category: 'Platform' },
  { title: 'Community Impact', description: 'Dashboard showing how community feedback shapes features.', status: 'in_progress', category: 'Community' },
  { title: 'Profile Experience 2.0', description: 'Dynamic grid layouts, country flags, and enhanced privacy controls.', status: 'in_progress', category: 'Core' },
  { title: 'Mobile Navigation Improvements', description: 'Quick-access menus and improved mobile UX patterns.', status: 'in_progress', category: 'UX' },
  { title: 'Community Management 2.0', description: 'Advanced tools for moderators and community owners.', status: 'in_progress', category: 'Community' },
  { title: 'Trust Center', description: 'Transparency reports, security resources, and platform trust documentation.', status: 'in_progress', category: 'Trust' },
  { title: 'Privacy Center', description: 'Comprehensive privacy controls, data exports, and deletion requests.', status: 'in_progress', category: 'Trust' },
  { title: 'Performance Improvements', description: 'Faster page loads, reduced bundle sizes, and optimized database queries.', status: 'in_progress', category: 'Infrastructure' },

  // ── TESTING ───────────────────────────────────────────────────────────────
  { title: 'Founder Mode', description: 'Bypass system and elevated access controls for the platform founder.', status: 'testing', category: 'Infrastructure' },
  { title: 'Country Recommendation System', description: 'Level 1 local and Level 2 global content recommendation engine.', status: 'testing', category: 'Discovery' },
  { title: 'Closed Beta Features', description: 'Early features only visible to approved beta testers.', status: 'testing', category: 'Beta' },
  { title: 'AI Character Prototype', description: 'First internal build of AI companion character interactions.', status: 'testing', category: 'AI' },
  { title: 'Performance Testing', description: 'Load testing, database optimization, and edge infrastructure validation.', status: 'testing', category: 'Infrastructure' },

  // ── PLANNED ───────────────────────────────────────────────────────────────
  { title: 'NEXA (AI Characters)', description: 'Create, customize, and chat with intelligent community AI Characters directly inside WHISPRR.', status: 'in_progress', category: 'AI' },
  { title: 'Character Memory', description: 'AI characters that remember your past conversations.', status: 'planned', category: 'AI' },
  { title: 'AI Roleplay', description: 'Collaborative roleplay scenarios with AI-driven narrative.', status: 'planned', category: 'AI' },
  { title: 'AI Companion System', description: 'Full AI companionship framework with relationship layers.', status: 'planned', category: 'AI' },
  { title: 'Voice Messages', description: 'Send voice notes in direct messages and communities.', status: 'planned', category: 'Social' },
  { title: 'Voice Spaces', description: 'Drop-in audio rooms for real-time community conversations.', status: 'planned', category: 'Social' },
  { title: 'Creator Profiles', description: 'Dedicated creator pages with analytics and verification.', status: 'planned', category: 'Creators' },
  { title: 'Creator Dashboard', description: 'Tools, stats, and insights for community creators.', status: 'planned', category: 'Creators' },
  { title: 'Community Events', description: 'Scheduled events, meetups, and themed community moments.', status: 'planned', category: 'Community' },
  { title: 'Translation System', description: 'Real-time translation for posts and messages across languages.', status: 'planned', category: 'Global' },
  { title: 'Community Marketplace', description: 'Curated spaces for community creators to offer experiences.', status: 'planned', category: 'Community' },

  // ── FUTURE VISION ─────────────────────────────────────────────────────────
  { title: 'Native iOS Application', description: 'A full native WHISPRR experience built for iPhone and iPad.', status: 'future_vision', category: 'Mobile' },
  { title: 'Native Android Application', description: 'A native WHISPRR application built for Android devices.', status: 'future_vision', category: 'Mobile' },
  { title: 'Tablet Experience', description: 'Optimized layouts for iPads and Android tablets.', status: 'future_vision', category: 'Mobile' },
  { title: 'Creator Monetization', description: 'Tips, premium subscriptions, and creator revenue tools.', status: 'future_vision', category: 'Creators' },
  { title: 'Creator Verification', description: 'Official verification process for notable creators.', status: 'future_vision', category: 'Creators' },
  { title: 'Creator Analytics', description: 'Deep insights into audience growth, reach, and engagement.', status: 'future_vision', category: 'Creators' },
  { title: 'Organization Accounts', description: 'Accounts for universities, businesses, schools, and NGOs.', status: 'future_vision', category: 'Business' },
  { title: 'Public API', description: 'Developer API to build integrations and third-party apps.', status: 'future_vision', category: 'Developer' },
  { title: 'Developer SDK', description: 'Official SDK for building WHISPRR-connected applications.', status: 'future_vision', category: 'Developer' },
  { title: 'Screen Reader Support', description: 'Full accessibility compliance and ARIA improvements.', status: 'future_vision', category: 'Accessibility' },
  { title: 'Real-time Translation', description: 'Instant in-app translation for conversations globally.', status: 'future_vision', category: 'Accessibility' },
  { title: 'AI Worlds', description: 'Shared virtual spaces powered by AI narrative engines.', status: 'future_vision', category: 'AI' },
  { title: 'Community Partnerships', description: 'Official partnerships with NGOs, schools, and creative orgs.', status: 'future_vision', category: 'Community' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ECOSYSTEM VISION – FUTURE VISION CLUSTERS
// ─────────────────────────────────────────────────────────────────────────────
const ECOSYSTEM_CLUSTERS = [
  {
    icon: '🌍',
    label: 'Global Ecosystem',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-200/40 dark:border-blue-900/40',
    accent: 'text-blue-600 dark:text-blue-400',
    items: ['WHISPRR Senegal', 'WHISPRR Canada', 'WHISPRR Japan', 'WHISPRR Brazil', 'WHISPRR France', 'WHISPRR Worldwide'],
  },
  {
    icon: '📱',
    label: 'Mobile Ecosystem',
    color: 'from-violet-500/20 to-purple-500/10 border-violet-200/40 dark:border-violet-900/40',
    accent: 'text-violet-600 dark:text-violet-400',
    items: ['Native iOS', 'Native Android', 'Tablet Experience', 'Offline Mode', 'Push Notifications'],
  },
  {
    icon: '🎨',
    label: 'Creator Ecosystem',
    color: 'from-orange-500/20 to-amber-500/10 border-orange-200/40 dark:border-orange-900/40',
    accent: 'text-orange-600 dark:text-orange-400',
    items: ['Creator Analytics', 'Creator Verification', 'Creator Tools', 'Creator Monetization', 'Creator Dashboard'],
  },
  {
    icon: '🏛️',
    label: 'Community Ecosystem',
    color: 'from-green-500/20 to-emerald-500/10 border-green-200/40 dark:border-green-900/40',
    accent: 'text-green-600 dark:text-green-400',
    items: ['Community Partnerships', 'Community Events', 'Community Challenges', 'Community Recognition', 'Community Marketplace'],
  },
  {
    icon: '🤖',
    label: 'AI Ecosystem',
    color: 'from-rose-500/20 to-pink-500/10 border-rose-200/40 dark:border-rose-900/40',
    accent: 'text-rose-600 dark:text-rose-400',
    items: ['AI Characters', 'AI Worlds', 'AI Voice', 'AI Memory', 'AI Companion System'],
  },
  {
    icon: '🛠️',
    label: 'Developer Ecosystem',
    color: 'from-slate-500/20 to-zinc-500/10 border-slate-200/40 dark:border-slate-900/40',
    accent: 'text-slate-600 dark:text-slate-400',
    items: ['Public API', 'Developer SDK', 'Integrations', 'Plugins', 'Webhooks'],
  },
  {
    icon: '🏢',
    label: 'Business Ecosystem',
    color: 'from-teal-500/20 to-cyan-500/10 border-teal-200/40 dark:border-teal-900/40',
    accent: 'text-teal-600 dark:text-teal-400',
    items: ['Organization Accounts', 'Universities', 'Schools', 'Businesses', 'Non-profit Organizations'],
  },
  {
    icon: '♿',
    label: 'Accessibility',
    color: 'from-indigo-500/20 to-blue-500/10 border-indigo-200/40 dark:border-indigo-900/40',
    accent: 'text-indigo-600 dark:text-indigo-400',
    items: ['Screen Reader Support', 'Localization', 'Real-time Translation', 'High Contrast Mode', 'Keyboard Navigation'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// THE DREAM
// ─────────────────────────────────────────────────────────────────────────────
const THE_DREAM = [
  { emoji: '🌱', text: 'Build the world\'s most human-centered social platform.' },
  { emoji: '🤝', text: 'Help people create genuine friendships across the globe.' },
  { emoji: '💬', text: 'Encourage meaningful conversations over empty engagement.' },
  { emoji: '🌍', text: 'Connect communities across cultures, languages, and borders.' },
  { emoji: '💜', text: 'Make social media feel human again — not transactional.' },
  { emoji: '🏡', text: 'Build a platform where people belong instead of competing for attention.' },
  { emoji: '✨', text: 'Create an ecosystem where technology strengthens human connection.' },
  { emoji: '🎯', text: 'Prove that a social platform can be ethical, joyful, and sustainable.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHANGELOG
// ─────────────────────────────────────────────────────────────────────────────
interface ChangelogVersion {
  version: string;
  label: string;
  newFeatures: string[];
  bugFixes: string[];
  improvements: string[];
}

const CHANGELOGS: ChangelogVersion[] = [
  {
    version: 'v4.0.0',
    label: 'Build Update',
    newFeatures: [
      'Implemented dynamic Badge & Identity System showing chronological earned dates.',
      'Created WHISPRR HQ (Founder Panel) for system-wide controls and analytics.',
      'Built Public Website with roadmap, changelog, journal, and beta program.',
      'Added Country Selection to onboarding with IP auto-detect.'
    ],
    bugFixes: [
      'Resolved Supabase RLS policies blocking conversation creation for new users.',
      'Fixed closing div tags causing layout compilation issues in main layout.'
    ],
    improvements: [
      'Completed Discovery & Recommendation interest-graph personalization engine.',
      'Updated mobile UX header with top-right Profile Dropdown access.',
      'Feature Flags module added to WHISPRR HQ for deployment-free toggles.'
    ]
  },
  {
    version: 'v3.5.0',
    label: 'Build Update',
    newFeatures: [
      'Released Group Messaging enabling chats of up to 50 members.',
      'Integrated real-time push notification indicators on tabs.'
    ],
    bugFixes: [
      'Resolved profile photo loading glitches for Google logins.',
      'Fixed timezone discrepancies in chat message timestamps.'
    ],
    improvements: [
      'Added backdrop-blur filter to desktop navigation and feed headers.',
      'Improved feed listing rendering performance by 35%.'
    ]
  },
  {
    version: 'v3.0.0',
    label: 'Build Update',
    newFeatures: [
      'Launched WHISPRR Communities with default interest channels.',
      'Created mood selector allowing users to set a custom current vibe.'
    ],
    bugFixes: [
      'Fixed unread notification count badge overlapping close button.',
      'Resolved scrolling memory leaks on communities search page.'
    ],
    improvements: [
      'Overhauled color palette introducing cozy warm neutral tones.',
      'Refactored authentication hooks for enhanced loading screens.'
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────────────────────────────────────
const TIMELINE = [
  { epoch: 'Epoch I', label: 'Private Beta Launch', description: 'WHISPRR opens doors to the first beta testers. Authentication, profiles, communities, and whisper posts go live.', icon: '🌱', done: true },
  { epoch: 'Epoch II', label: 'Messaging & Real-time', description: 'Direct messages and group chats. The social layer of WHISPRR comes to life.', icon: '💬', done: true },
  { epoch: 'Epoch III', label: 'Trust & Identity', description: 'Badge system, roles, Founder Dashboard, and the first Trust Center. WHISPRR starts to feel institutional.', icon: '🏅', done: false },
  { epoch: 'Epoch IV', label: 'Country Spaces & Discovery', description: 'Home country feeds, global exploration, and the interest-graph recommendation engine.', icon: '🌍', done: false },
  { epoch: 'Epoch V', label: 'AI Characters Preview', description: 'First public preview of AI companion characters. The AI ecosystem begins.', icon: '🤖', done: false },
  { epoch: 'Epoch VI', label: 'Creator Economy', description: 'Creator profiles, dashboards, monetization tools, and verified creator badges.', icon: '🎨', done: false },
  { epoch: 'Epoch VII', label: 'Mobile Ecosystem', description: 'Native iOS and Android applications. WHISPRR reaches everyone, everywhere.', icon: '📱', done: false },
  { epoch: 'Epoch VIII', label: 'Public Launch', description: 'WHISPRR opens registration globally. The ecosystem is ready for the world.', icon: '🚀', done: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK IMPACTS
// ─────────────────────────────────────────────────────────────────────────────
const FEEDBACK_IMPACTS = [
  { title: 'Mobile Settings Accessibility', status: 'implemented', votes: 204 },
  { title: 'Verification Timeline in Tooltips', status: 'recently_completed', votes: 142 },
  { title: 'Direct Messaging from Profile Page', status: 'recently_completed', votes: 189 },
  { title: 'Country Home Feed Priority', status: 'in_progress', votes: 378 },
  { title: 'Custom AI Voice Customizer', status: 'reviewing', votes: 312 },
  { title: 'Markdown Support in Whispers', status: 'reviewing', votes: 94 },
  { title: 'Group Chat Roles & Permissions', status: 'planned', votes: 156 },
  { title: 'GIF Picker in Comments', status: 'planned', votes: 82 },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATUS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<EcosystemStatus, {
  label: string; icon: React.ElementType;
  dotColor: string; headerBorder: string; cardBorder: string;
  badgeBg: string; barColor: string; glowColor: string;
}> = {
  released: {
    label: 'Released', icon: CheckCircle,
    dotColor: 'bg-emerald-500', headerBorder: 'border-emerald-300 dark:border-emerald-800',
    cardBorder: 'border-warm-150 dark:border-warm-700', badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    barColor: 'bg-emerald-400', glowColor: '',
  },
  in_progress: {
    label: 'In Progress', icon: Clock,
    dotColor: 'bg-amber-500 animate-pulse', headerBorder: 'border-amber-300 dark:border-amber-800',
    cardBorder: 'border-amber-100 dark:border-amber-900/30', badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    barColor: 'bg-amber-400', glowColor: '',
  },
  testing: {
    label: 'Testing', icon: FlaskConical,
    dotColor: 'bg-purple-500 animate-pulse', headerBorder: 'border-purple-300 dark:border-purple-800',
    cardBorder: 'border-purple-100 dark:border-purple-900/30', badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    barColor: 'bg-purple-400', glowColor: '',
  },
  planned: {
    label: 'Planned', icon: Eye,
    dotColor: 'bg-blue-400', headerBorder: 'border-blue-200 dark:border-blue-900',
    cardBorder: 'border-blue-100 dark:border-blue-900/20', badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    barColor: 'bg-blue-400', glowColor: '',
  },
  future_vision: {
    label: 'Future Vision', icon: Sparkles,
    dotColor: 'bg-pink-400', headerBorder: 'border-pink-200 dark:border-pink-900',
    cardBorder: 'border-pink-100 dark:border-pink-900/20', badgeBg: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
    barColor: 'bg-gradient-to-r from-pink-400 to-violet-400', glowColor: '',
  },
};

const STAGE_ORDER: EcosystemStatus[] = ['released', 'in_progress', 'testing', 'planned', 'future_vision'];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function BuildingPage() {
  const [activeTab, setActiveTab] = useState<RoadmapTab>('roadmap');

  return (
    <div className="page-container max-w-5xl">
      {/* Vision Header */}
      <div className="text-center py-12 relative overflow-hidden bg-gradient-to-b from-warm-100/50 to-transparent dark:from-warm-850/30 rounded-3xl mb-8 border border-warm-200/40 dark:border-warm-800/40">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-400/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <Rocket size={12} />
            <span>Open Development Journal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-warm-900 dark:text-warm-50 tracking-tight mb-4">
            Building WHISPRR
          </h1>
          <p className="text-warm-600 dark:text-warm-300 text-base leading-relaxed">
            We believe great platforms are built in the open. This is a live look at WHISPRR's product journey — where we are today, 
            what we're building, and where this platform is going.
          </p>

          {/* Stage Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {STAGE_ORDER.map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                  <span className="text-xs font-semibold text-warm-600 dark:text-warm-400">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-warm-200 dark:border-warm-800/40 mb-8 overflow-x-auto select-none gap-0">
        {([
          { key: 'roadmap' as RoadmapTab, label: '🚀 Ecosystem Roadmap', icon: Rocket },
          { key: 'feedback' as RoadmapTab, label: '🤝 Community Impact', icon: Heart },
          { key: 'changelog' as RoadmapTab, label: '📝 Changelog', icon: GitCommit },
          { key: 'journey' as RoadmapTab, label: '📅 The Journey', icon: Calendar }
        ]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-bold'
                  : 'border-transparent text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── ROADMAP TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'roadmap' && (
        <div className="space-y-16 animate-fade-in">

          {/* Stages: Released, In Progress, Testing, Planned */}
          {STAGE_ORDER.filter(s => s !== 'future_vision').map(status => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            const items = ROADMAP_ITEMS.filter(i => i.status === status);

            return (
              <section key={status}>
                {/* Stage Header */}
                <div className={`flex items-center gap-3 mb-5 pb-3 border-b-2 ${cfg.headerBorder}`}>
                  <Icon size={20} className={
                    status === 'released' ? 'text-emerald-500' :
                    status === 'in_progress' ? 'text-amber-500' :
                    status === 'testing' ? 'text-purple-500' :
                    'text-blue-400'
                  } />
                  <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50">{cfg.label}</h2>
                  <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.badgeBg}`}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Cards Grid */}
                <div className={`grid gap-3 ${
                  status === 'released' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'
                }`}>
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`public-card-status p-4 group hover:opacity-90 transition-opacity ${cfg.cardBorder}`}
                    >
                      {/* Status accent bar */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.barColor}`} />

                      {/* Live dot for active stages */}
                      {(status === 'in_progress' || status === 'testing') && (
                        <div className="absolute top-3 right-3">
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${cfg.dotColor}`} />
                        </div>
                      )}

                      <span className={`text-[9px] uppercase font-bold tracking-wider block mb-1.5 ${
                        status === 'released' ? 'text-emerald-600 dark:text-emerald-400' :
                        status === 'in_progress' ? 'text-amber-600 dark:text-amber-400' :
                        status === 'testing' ? 'text-purple-600 dark:text-purple-400' :
                        'text-blue-500 dark:text-blue-400'
                      }`}>
                        {item.category}
                      </span>
                      <h4 className="font-semibold text-sm text-warm-900 dark:text-white leading-tight mb-1">
                        {item.title}
                      </h4>
                      {status !== 'released' && (
                        <p className="text-xs text-warm-600 dark:text-warm-350 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* ── FUTURE VISION ──────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-pink-200 dark:border-pink-900">
              <Sparkles size={20} className="text-pink-500" />
              <div>
                <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50">Future Vision</h2>
                <p className="text-xs text-warm-500 mt-0.5">Where WHISPRR is going as a complete ecosystem</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ECOSYSTEM_CLUSTERS.map((cluster, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-3xl border bg-gradient-to-br ${cluster.color}`}
                >
                  <div className="text-2xl mb-3">{cluster.icon}</div>
                  <h3 className={`font-serif font-bold text-sm mb-3 ${cluster.accent}`}>{cluster.label}</h3>
                  <ul className="space-y-1.5">
                    {cluster.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-warm-700 dark:text-warm-300">
                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${cluster.accent.replace('text-', 'bg-').split(' ')[0]}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── BEYOND WHISPRR ────────────────────────────────────────────── */}
          <section className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                <Globe size={12} />
                <span>Long-term Aspirations</span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-warm-900 dark:text-warm-50 mb-3">🌍 Beyond WHISPRR</h2>
              <p className="text-warm-500 dark:text-warm-400 text-sm leading-relaxed">
                This is not a promise. This is the world we are working toward — together.
                Where WHISPRR hopes to be, not just as a product, but as a presence in people's lives.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: '📱', title: 'Everywhere You Are',
                  desc: 'Native iOS and Android applications. Desktop and tablet experiences. WHISPRR in your pocket, at your desk, and across every device.',
                  gradient: 'from-violet-500/15 to-indigo-500/10', border: 'border-violet-200/50 dark:border-violet-900/40', accent: 'text-violet-600 dark:text-violet-400',
                },
                {
                  icon: '🌍', title: 'A Truly Global Home',
                  desc: 'Country Spaces for every nation. Dozens of languages. Real-time translation. A home for every culture, community, and conversation.',
                  gradient: 'from-cyan-500/15 to-blue-500/10', border: 'border-cyan-200/50 dark:border-cyan-900/40', accent: 'text-cyan-600 dark:text-cyan-400',
                },
                {
                  icon: '🤝', title: 'Millions of Connections',
                  desc: 'Millions of meaningful conversations. Healthy communities. Community partnerships. Global events that bring people together.',
                  gradient: 'from-green-500/15 to-emerald-500/10', border: 'border-green-200/50 dark:border-green-900/40', accent: 'text-green-600 dark:text-green-400',
                },
                {
                  icon: '🎨', title: 'Creators at the Center',
                  desc: 'Creator profiles, analytics, and recognition. A platform where creators are celebrated, not algorithmically suppressed.',
                  gradient: 'from-orange-500/15 to-amber-500/10', border: 'border-orange-200/50 dark:border-orange-900/40', accent: 'text-orange-600 dark:text-orange-400',
                },
                {
                  icon: '🤖', title: 'A New Kind of Intelligence',
                  desc: 'AI Characters, AI Companions, AI Worlds, and AI Voice. Technology that augments human connection — never replaces it.',
                  gradient: 'from-rose-500/15 to-pink-500/10', border: 'border-rose-200/50 dark:border-rose-900/40', accent: 'text-rose-600 dark:text-rose-400',
                },
                {
                  icon: '🏛️', title: 'Institutions & Organizations',
                  desc: 'Universities, schools, non-profits, and businesses. A platform for organizations that want to build genuine community.',
                  gradient: 'from-teal-500/15 to-cyan-500/10', border: 'border-teal-200/50 dark:border-teal-900/40', accent: 'text-teal-600 dark:text-teal-400',
                },
                {
                  icon: '🛠️', title: 'Open to Builders',
                  desc: 'Public API, Developer SDK, integrations, and plugins. An ecosystem built not just for users — but for the developers who want to extend it.',
                  gradient: 'from-slate-500/15 to-zinc-500/10', border: 'border-slate-200/50 dark:border-slate-900/40', accent: 'text-slate-600 dark:text-slate-400',
                },
                {
                  icon: '♿', title: 'Inclusive by Design',
                  desc: 'Screen reader support, localization, real-time translation, and accessibility improvements. WHISPRR should work for everyone.',
                  gradient: 'from-indigo-500/15 to-blue-500/10', border: 'border-indigo-200/50 dark:border-indigo-900/40', accent: 'text-indigo-600 dark:text-indigo-400',
                },
              ].map((card, idx) => (
                <div key={idx} className={`p-5 rounded-3xl border bg-gradient-to-br ${card.gradient} ${card.border} group hover:scale-[1.02] transition-transform`}>
                  <div className="text-2xl mb-3">{card.icon}</div>
                  <h3 className={`font-serif font-bold text-sm mb-2 ${card.accent}`}>{card.title}</h3>
                  <p className="text-xs text-warm-600 dark:text-warm-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center py-4">
              <p className="text-xs text-warm-900 dark:text-white font-semibold italic">
                These are aspirations, not promises. Features move to the roadmap only when actively planned or in development.
              </p>
            </div>
          </section>

          {/* ── THE DREAM ──────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-950/90 via-warm-950 to-violet-950 p-10 border border-primary-800/30">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <Stars size={22} className="text-yellow-400" />
                <h2 className="font-serif text-2xl font-bold text-white">✨ The Dream</h2>
              </div>
              <p className="text-white/50 text-sm mb-8 italic">
                This is not a roadmap. This is the long-term mission of WHISPRR.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {THE_DREAM.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/8 transition-colors">
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <p className="text-white/85 text-sm leading-relaxed font-medium">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 text-center space-y-4">
                <p className="text-white/80 text-lg font-serif font-bold leading-relaxed">
                  "The future of WHISPRR will be written together —<br />
                  with every conversation, every community, and every person who chooses to belong."
                </p>
                <p className="text-white/35 text-xs italic">
                  This is only the beginning.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── COMMUNITY IMPACT TAB ──────────────────────────────────────────── */}
      {activeTab === 'feedback' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-primary-50/50 dark:bg-primary-950/10 border border-primary-100 dark:border-primary-900/30 rounded-3xl flex items-start gap-4">
            <Heart className="text-primary-500 shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">✨ Built from Community Feedback</h3>
              <p className="text-sm text-warm-600 dark:text-warm-400 mt-1 leading-relaxed">
                Features aren't selected in a boardroom. We track request popularity, beta tester suggestions, and community signals. 
                If you suggested it — it genuinely changes WHISPRR.
              </p>
            </div>
          </div>

          <div className="public-card p-6 space-y-4">
            <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 pb-2 border-b border-warm-150 dark:border-white/[0.06]">
              Community Requested Features
            </h4>
            <div className="space-y-3">
              {FEEDBACK_IMPACTS.map((f, idx) => {
                const statusStyle =
                  f.status === 'implemented' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' :
                  f.status === 'recently_completed' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300' :
                  f.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' :
                  f.status === 'reviewing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' :
                  'bg-warm-100 text-warm-600 dark:bg-warm-700 dark:text-warm-400';
                const statusLabel =
                  f.status === 'recently_completed' ? 'Just Released' :
                  f.status === 'in_progress' ? 'In Progress' :
                  f.status;
                return (
                  <div key={idx} className="flex items-center justify-between p-3.5 public-card-secondary rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-warm-900 dark:text-warm-100">{f.title}</p>
                      <p className="text-[10px] text-warm-600 dark:text-warm-350 mt-0.5">👍 {f.votes.toLocaleString()} community interest flags</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyle}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGELOG TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'changelog' && (
        <div className="space-y-6 animate-fade-in">
          {CHANGELOGS.map((ch, idx) => (
            <div key={idx} className="public-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-warm-150 dark:border-white/[0.06] pb-3">
                <div>
                  <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50">{ch.version}</h3>
                </div>
                <span className="text-[10px] font-bold bg-primary-100 dark:bg-primary-950/50 text-primary-650 dark:text-primary-300 px-3 py-1 rounded-full">
                  {ch.label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-2">
                  <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase text-xs tracking-wider">New Features</h4>
                  <ul className="space-y-1 text-xs text-warm-650 dark:text-warm-300 list-disc list-inside">
                    {ch.newFeatures.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary-650 dark:text-primary-400 uppercase text-xs tracking-wider">Improvements</h4>
                  <ul className="space-y-1 text-xs text-warm-650 dark:text-warm-300 list-disc list-inside">
                    {ch.improvements.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600 dark:text-red-400 uppercase text-xs tracking-wider">Bug Fixes</h4>
                  <ul className="space-y-1 text-xs text-warm-650 dark:text-warm-300 list-disc list-inside">
                    {ch.bugFixes.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── JOURNEY TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'journey' && (
        <div className="py-6 animate-fade-in">
          <div className="mb-8 text-center">
            <p className="text-sm text-warm-500 italic">
              WHISPRR grows in epochs — major phases of platform evolution. Each epoch unlocks a new layer of the ecosystem.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute top-0 bottom-0 left-6 md:left-1/2 w-0.5 bg-gradient-to-b from-emerald-300 via-primary-300 to-violet-300 dark:from-emerald-800 dark:via-primary-800 dark:to-violet-800" />

            <div className="space-y-10">
              {TIMELINE.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className="relative flex flex-col md:flex-row items-start md:items-center">
                    {/* Circle icon */}
                    <div className={`absolute left-3.5 md:left-1/2 md:-translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs z-10 shadow-sm ${
                      item.done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white dark:bg-warm-950 border-primary-650 dark:border-primary-600 text-primary-650 dark:text-primary-400'
                    }`}>
                      {item.done ? '✓' : ''}
                    </div>

                    {/* Content card */}
                    <div className={`w-full md:w-1/2 pl-14 md:pl-0 ${
                      isEven ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'
                    }`}>
                      <div className={`public-card p-5 inline-block max-w-sm text-left ${
                        item.done ? 'border-emerald-200 dark:border-emerald-900/40' : 'border-warm-150 dark:border-warm-700'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wide block mb-1 ${
                          item.done ? 'text-emerald-500' : 'text-primary-500'
                        }`}>
                          {item.epoch}
                        </span>
                        <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-100 mb-1">
                          {item.label}
                        </h4>
                        <p className="text-xs text-warm-600 dark:text-warm-400 leading-relaxed">
                          {item.description}
                        </p>
                        {item.done && (
                          <span className="inline-block mt-2 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
