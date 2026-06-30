import { useState } from 'react';
import { 
  Rocket, Construction, Calendar, GitCommit, Heart, Sparkles, MessageSquare, 
  MapPin, CheckCircle, Clock, Eye, AlertCircle, ArrowRight, User, Users
} from 'lucide-react';
import { Avatar } from '../components/common/Avatar';

type RoadmapTab = 'roadmap' | 'changelog' | 'journey' | 'feedback';

interface RoadmapItem {
  title: string;
  description: string;
  status: 'released' | 'in_progress' | 'planned';
  category: 'core' | 'ai' | 'community' | 'social';
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  // Released
  { title: 'User Profiles', description: 'Rich profile customization, bio, locations, and interests.', status: 'released', category: 'core' },
  { title: 'Communities', description: 'Interest-based group spaces to connect and share whispers.', status: 'released', category: 'community' },
  { title: 'Whisper Posts', description: 'Publishing whispers with custom emotions and media attachments.', status: 'released', category: 'core' },
  { title: 'Direct Messages', description: 'Real-time encrypted one-on-one messaging.', status: 'released', category: 'social' },
  { title: 'Group Chats', description: 'Collaborative messaging spaces for multiple users.', status: 'released', category: 'social' },
  { title: 'Discovery Engine', description: 'Finding active users and trending posts on the platform.', status: 'released', category: 'core' },
  
  // In Progress
  { title: 'Profile Experience 2.0', description: 'Dynamic grid layouts, customized widgets, and enhanced privacy controls.', status: 'in_progress', category: 'core' },
  { title: 'Founder Dashboard & Bypass', description: 'Central controls for server bypass, system health, and roles management.', status: 'in_progress', category: 'core' },
  { title: 'Dynamic Badge System', description: 'Historical badge timeline, automatic roles, and Early Supporter awards.', status: 'in_progress', category: 'community' },
  { title: 'Discovery & Recommendation Algorithm', description: 'Personalized interest-graph feeds without addictive scroll mechanics.', status: 'in_progress', category: 'core' },
  { title: 'Community Analytics', description: 'Insights, active times, and membership charts for moderators.', status: 'in_progress', category: 'community' },
  { title: 'Mobile Navigation Improvements', description: 'Quick settings accessibility and Discord-style slide down menus.', status: 'in_progress', category: 'core' },

  // Planned
  { title: 'AI Companion Characters', description: 'Create and converse with personalized AI companion avatars.', status: 'planned', category: 'ai' },
  { title: 'Roleplay Worlds', description: 'Shared virtual settings for roleplaying and creative writing.', status: 'planned', category: 'social' },
  { title: 'Long-term Character Memory', description: 'Allow AI characters to remember interactions and build relationship history.', status: 'planned', category: 'ai' },
  { title: 'Creator Monetization Tools', description: 'Enable hosts and creators to lock content or receive tips.', status: 'planned', category: 'community' },
  { title: 'Voice Rooms & Audio Rooms', description: 'Drop-in audio spaces for real-time conversation and voice rooms.', status: 'planned', category: 'social' },
  { title: 'Creator Tools', description: 'Advanced formatting, embedding support, and templates.', status: 'planned', category: 'community' },
];

interface ChangelogVersion {
  version: string;
  date: string;
  newFeatures: string[];
  bugFixes: string[];
  improvements: string[];
}

const CHANGELOGS: ChangelogVersion[] = [
  {
    version: 'v4.0.0',
    date: 'June 30, 2026',
    newFeatures: [
      'Implemented dynamic Badge & Identity System showing chronological earned dates.',
      'Created Founder Panel for system-wide controls, analytics, and user moderations.'
    ],
    bugFixes: [
      'Resolved Supabase RLS policies blocking conversation creation for new users.',
      'Fixed closing div tags causing layout compilation issues in main layout.'
    ],
    improvements: [
      'Completed Discovery & Recommendation interest-graph personalization engine.',
      'Updated mobile UX header introducing top-right Profile Dropdown access.'
    ]
  },
  {
    version: 'v3.5.0',
    date: 'June 18, 2026',
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
    date: 'June 01, 2026',
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

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: string;
}

const TIMELINE: TimelineEvent[] = [
  { date: 'June 2026', title: '🌱 Private Beta Launch', description: 'WHISPRR opens doors to private alpha test group.', icon: '🌱' },
  { date: 'July 2026', title: '💬 Real-time Direct Messages', description: 'Enabling real-time chat with users across the platform.', icon: '💬' },
  { date: 'August 2026', title: '🧩 Communities 2.0', description: 'Introduction of custom community moderation and creator tools.', icon: '🧩' },
  { date: 'September 2026', title: '👑 Founder Dashboard', description: 'System health checks, maintenance control, and moderator rights.', icon: '👑' },
  { date: 'October 2026', title: '🎭 AI Characters Preview', description: 'First preview release of customizable companion characters.', icon: '🎭' }
];

interface FeedbackImpact {
  title: string;
  status: 'implemented' | 'reviewing' | 'planned';
  votes: number;
}

const FEEDBACK_IMPACTS: FeedbackImpact[] = [
  { title: 'Dark Mode Contrast Improvements', status: 'implemented', votes: 142 },
  { title: 'Direct Settings Link on Mobile Header', status: 'implemented', votes: 204 },
  { title: 'Direct Messaging from Profile Page', status: 'implemented', votes: 189 },
  { title: 'Custom AI Voice Customizer', status: 'reviewing', votes: 312 },
  { title: 'Markdown Support in Whispers', status: 'reviewing', votes: 94 },
  { title: 'Group Chat Roles & Permissions', status: 'planned', votes: 156 },
  { title: 'GIF Picker in Comments', status: 'planned', votes: 82 }
];

export default function BuildingPage() {
  const [activeTab, setActiveTab] = useState<RoadmapTab>('roadmap');

  return (
    <div className="page-container max-w-4xl">
      {/* Vision Header */}
      <div className="text-center py-10 relative overflow-hidden bg-gradient-to-b from-warm-100/50 to-transparent dark:from-warm-850/30 rounded-3xl mb-8 border border-warm-200/40 dark:border-warm-800/40">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Rocket size={12} />
            <span>Open Development Journal</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 tracking-tight">
            Building WHISPRR
          </h1>
          <p className="text-warm-600 dark:text-warm-300 mt-3 text-base leading-relaxed">
            We believe social software should be built in the open. 
            Here is a transparent, real-time look at WHISPRR’s product journey, 
            what we’re focusing on today, and how your feedback directly shapes our roadmap.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-warm-200 dark:border-warm-750 mb-6 overflow-x-auto select-none">
        {([
          { key: 'roadmap' as RoadmapTab, label: '🚀 Product Roadmap', icon: Rocket },
          { key: 'feedback' as RoadmapTab, label: '🤝 Community Impact', icon: Heart },
          { key: 'changelog' as RoadmapTab, label: '📝 Public Changelog', icon: GitCommit },
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

      {/* Tab Renderings */}
      {activeTab === 'roadmap' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Released column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-green-200 dark:border-green-900/40">
                <CheckCircle size={18} className="text-green-500" />
                <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-100">Released</h3>
              </div>
              <div className="space-y-3">
                {ROADMAP_ITEMS.filter(item => item.status === 'released').map((item, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-warm-800 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-soft">
                    <span className="text-[9px] uppercase font-bold text-primary-500 tracking-wider block mb-1">
                      {item.category}
                    </span>
                    <h4 className="font-semibold text-sm text-warm-900 dark:text-warm-100">{item.title}</h4>
                    <p className="text-xs text-warm-500 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200 dark:border-amber-900/40">
                <Clock size={18} className="text-amber-500" />
                <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-100">In Progress</h3>
              </div>
              <div className="space-y-3">
                {ROADMAP_ITEMS.filter(item => item.status === 'in_progress').map((item, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-warm-800 rounded-2xl border border-amber-100 dark:border-amber-900/20 shadow-soft relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400/30" />
                    <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block mb-1">
                      {item.category}
                    </span>
                    <h4 className="font-semibold text-sm text-warm-900 dark:text-warm-100 flex items-center gap-1.5">
                      {item.title}
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                    </h4>
                    <p className="text-xs text-warm-500 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Planned column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-warm-250 dark:border-warm-700">
                <Eye size={18} className="text-warm-400" />
                <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-100">Planned</h3>
              </div>
              <div className="space-y-3">
                {ROADMAP_ITEMS.filter(item => item.status === 'planned').map((item, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-warm-800 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-soft">
                    <span className="text-[9px] uppercase font-bold text-warm-450 tracking-wider block mb-1">
                      {item.category}
                    </span>
                    <h4 className="font-semibold text-sm text-warm-750 dark:text-warm-200">{item.title}</h4>
                    <p className="text-xs text-warm-500 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-primary-50/50 dark:bg-primary-950/10 border border-primary-100 dark:border-primary-900/30 rounded-3xl flex items-start gap-4">
            <Heart className="text-primary-500 shrink-0 mt-0.5" size={24} />
            <div>
               <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">Community Impact Dashboard</h3>
               <p className="text-sm text-warm-600 dark:text-warm-450 mt-1 leading-relaxed">
                 Features aren’t selected in a boardroom. We track request popularity, beta tester suggestions, 
                 and bug reports. If you suggested it, it genuinely changes WHISPRR.
               </p>
            </div>
          </div>

          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-150 dark:border-warm-700 shadow-soft space-y-4">
             <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-100 pb-2 border-b border-warm-100 dark:border-warm-750">
                Community Requested Features Status
             </h4>
             <div className="space-y-3">
                {FEEDBACK_IMPACTS.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 rounded-2xl">
                     <div>
                        <p className="text-sm font-semibold text-warm-850 dark:text-warm-100">{f.title}</p>
                        <p className="text-[10px] text-warm-500 mt-0.5">👍 {f.votes} community interest flags</p>
                     </div>
                     <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                       f.status === 'implemented' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300' :
                       f.status === 'reviewing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' :
                       'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                     }`}>
                       {f.status}
                     </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'changelog' && (
        <div className="space-y-6 animate-fade-in">
          {CHANGELOGS.map((ch, idx) => (
            <div key={idx} className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-150 dark:border-warm-700 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-warm-100 dark:border-warm-750 pb-3">
                 <div>
                    <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50">{ch.version}</h3>
                    <p className="text-xs text-warm-500 mt-0.5">Released {ch.date}</p>
                 </div>
                 <span className="text-[10px] font-bold bg-primary-100 dark:bg-primary-950/50 text-primary-650 dark:text-primary-300 px-3 py-1 rounded-full">
                    Stable Release
                 </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                 <div className="space-y-2">
                    <h4 className="font-semibold text-emerald-600 dark:text-emerald-450 uppercase text-xs tracking-wider">New Features</h4>
                    <ul className="space-y-1 text-xs text-warm-600 dark:text-warm-350 list-disc list-inside">
                       {ch.newFeatures.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                 </div>

                 <div className="space-y-2">
                    <h4 className="font-semibold text-primary-500 uppercase text-xs tracking-wider">Improvements</h4>
                    <ul className="space-y-1 text-xs text-warm-600 dark:text-warm-350 list-disc list-inside">
                       {ch.improvements.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                 </div>

                 <div className="space-y-2">
                    <h4 className="font-semibold text-red-500 uppercase text-xs tracking-wider">Bug Fixes</h4>
                    <ul className="space-y-1 text-xs text-warm-600 dark:text-warm-350 list-disc list-inside">
                       {ch.bugFixes.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'journey' && (
        <div className="py-6 animate-fade-in relative">
          <div className="absolute top-0 bottom-0 left-4 md:left-1/2 w-0.5 bg-warm-200 dark:bg-warm-750" />
          
          <div className="space-y-12">
             {TIMELINE.map((item, idx) => {
               const isEven = idx % 2 === 0;
               return (
                 <div key={idx} className="relative flex flex-col md:flex-row items-start md:items-center">
                    {/* Circle icon */}
                    <div className="absolute left-1.5 md:left-1/2 md:-translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-warm-850 border-2 border-primary-500 flex items-center justify-center text-xs z-10 shadow-sm">
                       {item.icon}
                    </div>

                    {/* Timeline Content card */}
                    <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${
                      isEven ? 'md:pr-10 md:text-right' : 'md:pl-10 md:ml-auto'
                    }`}>
                       <div className="p-5 bg-white dark:bg-warm-800 rounded-3xl border border-warm-150 dark:border-warm-700 shadow-soft inline-block max-w-sm text-left">
                          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wide block mb-1">
                             {item.date}
                          </span>
                          <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-100">
                             {item.title}
                          </h4>
                          <p className="text-xs text-warm-500 mt-1 leading-relaxed">
                             {item.description}
                          </p>
                       </div>
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      )}
    </div>
  );
}
