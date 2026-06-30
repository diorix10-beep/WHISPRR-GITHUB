import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, Calendar, GitCommit, Heart, Sparkles, MessageSquare, 
  CheckCircle, Clock, Eye, AlertCircle, ArrowRight, Shield, Globe, 
  Smile, Send, ChevronRight, PenTool, BookOpen, Bug, Award, Users, Info,
  ExternalLink, Megaphone, FlaskConical, Lightbulb, HelpCircle, Lock, Map, FileText
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

type LandingSection = 'home' | 'about' | 'building' | 'updates' | 'beta' | 'connect';

interface BlogArticle {
  title: string;
  excerpt: string;
  date: string;
  category: 'Founder Journal' | 'Product Update' | 'Technical Article' | 'Privacy Update';
  author: string;
  readTime: string;
  content?: string;
}

const ARTICLES: BlogArticle[] = [
  {
    title: 'Founder Log #1: The Genesis of WHISPRR',
    excerpt: 'Reflecting on why social networks got bloated, and why returning to simple, asynchronous interest graphs is the only way forward.',
    date: 'June 28, 2026',
    category: 'Founder Journal',
    author: 'nyny59 (Founder)',
    readTime: '5 min read',
    content: 'Social networks have transitioned from tools of connection to machines of extraction. We started WHISPRR because we wanted a place to share ideas, join interest circles, and read thoughts without feeling manipulated. This journal documents that progress.'
  },
  {
    title: 'Designing Social Software for Mental Well-being',
    excerpt: 'How we engineered a platform that doesn’t use infinite scroll, red dots, or notification triggers to hijack your dopaminergic pathways.',
    date: 'June 29, 2026',
    category: 'Privacy Update',
    author: 'Design Guild',
    readTime: '8 min read'
  },
  {
    title: 'Founder Log #2: Introducing Trust & Roles',
    excerpt: 'A behind-the-scenes look at the dynamic badge system. Why badges represent contribution, history, and responsibility rather than clout.',
    date: 'June 30, 2026',
    category: 'Founder Journal',
    author: 'nyny59 (Founder)',
    readTime: '6 min read'
  },
  {
    title: 'Community Ingestion & Recommendation Mechanics',
    excerpt: 'A technical breakdown of our interest matching engine, showing how we index posts using geographic, language, and topic affinities.',
    date: 'June 25, 2026',
    category: 'Technical Article',
    author: 'Engineering Guild',
    readTime: '10 min read'
  }
];

interface RoadmapItem {
  title: string;
  description: string;
  status: 'released' | 'in_progress' | 'testing' | 'planned' | 'future_vision';
  category: string;
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  // Released
  { title: 'Authentication', description: 'Email, Google, and secure session management.', status: 'released', category: 'Core' },
  { title: 'User Profiles', description: 'Rich profiles with interests, bios, moods, and avatars.', status: 'released', category: 'Core' },
  { title: 'Whisper Posts', description: 'Publishing posts with custom emotions and media.', status: 'released', category: 'Core' },
  { title: 'Communities', description: 'Interest-based group spaces with moderator controls.', status: 'released', category: 'Social' },
  { title: 'Direct Messages', description: 'Real-time one-on-one messaging.', status: 'released', category: 'Social' },
  { title: 'Group Chats', description: 'Collaborative messaging for multiple users.', status: 'released', category: 'Social' },
  { title: 'Notifications', description: 'Real-time alerts for mentions, likes, and messages.', status: 'released', category: 'Core' },
  { title: 'Discovery Engine', description: 'Finding active users, posts, and trending topics.', status: 'released', category: 'Discovery' },

  // In Progress
  { title: 'Badge & Identity System', description: 'Chronological badges reflecting contribution, history, and trust.', status: 'in_progress', category: 'Trust' },
  { title: 'WHISPRR HQ', description: 'Central command center for system control and publishing.', status: 'in_progress', category: 'Infrastructure' },
  { title: 'Country Spaces', description: 'Home country priority feeds and global exploration.', status: 'in_progress', category: 'Global' },
  { title: 'Discovery Algorithm', description: 'Interest-graph personalization without addictive patterns.', status: 'in_progress', category: 'Discovery' },
  { title: 'Public Product Website', description: 'The official home of the WHISPRR project.', status: 'in_progress', category: 'Platform' },
  { title: 'Community Management 2.0', description: 'Advanced tools for moderators and community owners.', status: 'in_progress', category: 'Community' },
  { title: 'Trust & Privacy Centers', description: 'Transparency reports and comprehensive privacy controls.', status: 'in_progress', category: 'Trust' },
  { title: 'Performance Improvements', description: 'Faster loads, reduced bundles, and query optimization.', status: 'in_progress', category: 'Infrastructure' },

  // Testing
  { title: 'Founder Mode', description: 'Bypass system and elevated controls for the platform founder.', status: 'testing', category: 'Infrastructure' },
  { title: 'Country Recommendation System', description: 'Level 1 local and Level 2 global recommendation engine.', status: 'testing', category: 'Discovery' },
  { title: 'AI Character Prototype', description: 'First internal build of AI companion character interactions.', status: 'testing', category: 'AI' },

  // Planned
  { title: 'AI Characters', description: 'Customizable AI companion avatars with distinct personalities.', status: 'planned', category: 'AI' },
  { title: 'Character Memory', description: 'AI characters that remember your past conversations.', status: 'planned', category: 'AI' },
  { title: 'Voice Spaces', description: 'Drop-in audio rooms for real-time community conversations.', status: 'planned', category: 'Social' },
  { title: 'Creator Profiles', description: 'Dedicated creator pages with analytics and verification.', status: 'planned', category: 'Creators' },
  { title: 'Community Events', description: 'Scheduled events and themed community moments.', status: 'planned', category: 'Community' },
  { title: 'Translation System', description: 'Real-time translation for posts and messages.', status: 'planned', category: 'Global' },

  // Future Vision
  { title: 'Native iOS & Android', description: 'Full native WHISPRR mobile applications.', status: 'future_vision', category: 'Mobile' },
  { title: 'Creator Monetization', description: 'Tips, premium subscriptions, and creator revenue tools.', status: 'future_vision', category: 'Creators' },
  { title: 'Public API & SDK', description: 'Developer tools to build WHISPRR-connected applications.', status: 'future_vision', category: 'Developer' },
  { title: 'AI Worlds', description: 'Shared virtual spaces powered by AI narrative engines.', status: 'future_vision', category: 'AI' },
  { title: 'Organization Accounts', description: 'Accounts for universities, businesses, and NGOs.', status: 'future_vision', category: 'Business' },
];

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: string;
}

const TIMELINE: TimelineEvent[] = [
  { date: 'June 2026', title: '🌱 Private Beta Launch', description: 'WHISPRR opens doors to beta tester list.', icon: '🌱' },
  { date: 'July 2026', title: '💬 Messaging & Groups', description: 'Direct messages and real-time group chats.', icon: '💬' },
  { date: 'August 2026', title: '🧩 Communities', description: 'Interest groups with dynamic moderator roles.', icon: '🧩' },
  { date: 'September 2026', title: '👑 Founder Dashboard', description: 'Central controls and maintenance page bypass.', icon: '👑' },
  { date: 'September 2026', title: '🏅 Badge & Identity System', description: 'Dynamic timeline user badges.', icon: '🏅' },
  { date: 'October 2026', title: '🎭 AI Characters', description: 'Interactive virtual companion preview.', icon: '🎭' },
  { date: 'December 2026', title: '🌍 Public Launch', description: 'Opening registration globally.', icon: '🌍' }
];

interface ChangelogVersion {
  version: string;
  date: string;
  newFeatures: string[];
  bugFixes: string[];
  improvements: string[];
  performance: string[];
}

const CHANGELOGS: ChangelogVersion[] = [
  {
    version: 'v4.0.0',
    date: 'June 30, 2026',
    newFeatures: [
      'Implemented dynamic Badge & Identity System showing chronological earned dates.',
      'Created Founder Panel for system-wide controls, analytics, and user moderations.',
      'Created public Building page showing product updates and community feedback logs.'
    ],
    bugFixes: [
      'Resolved Supabase RLS policies blocking conversation creation for new users.',
      'Fixed closing div tags causing layout compilation issues in main layout.'
    ],
    improvements: [
      'Completed Discovery & Recommendation interest-graph personalization engine.',
      'Updated mobile UX header introducing top-right Profile Dropdown access.'
    ],
    performance: [
      'Reduced initial bundle chunk size by lazy loading dashboard views.',
      'Decreased user badges database query latency via profile array caching.'
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
      'Added backdrop-blur filter to desktop navigation and feed headers.'
    ],
    performance: [
      'Improved feed listing rendering performance by 35%.'
    ]
  }
];

interface FeedbackImpact {
  title: string;
  status: 'implemented' | 'recently_completed' | 'reviewing' | 'planned';
  votes: number;
}

const FEEDBACK_IMPACTS: FeedbackImpact[] = [
  { title: 'Mobile Settings Accessibility', status: 'implemented', votes: 204 },
  { title: 'Verification Timeline in Tooltips', status: 'recently_completed', votes: 142 },
  { title: 'Direct Messaging from Profile Page', status: 'recently_completed', votes: 189 },
  { title: 'Custom AI Voice Customizer', status: 'reviewing', votes: 312 },
  { title: 'Markdown Support in Whispers', status: 'reviewing', votes: 94 },
  { title: 'Group Chat Roles & Permissions', status: 'planned', votes: 156 },
  { title: 'GIF Picker in Comments', status: 'planned', votes: 82 }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<LandingSection>('home');
  const [activeBlogCategory, setActiveBlogCategory] = useState<string>('All');
  
  // Feedback / Beta application form state
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'ux' | 'beta'>('ux');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        type: feedbackType === 'beta' ? 'community' : feedbackType,
        title: feedbackTitle,
        description: feedbackDesc,
        status: 'new'
      });
      if (error) throw error;
      
      const successMsg = feedbackType === 'beta' 
        ? 'Application submitted successfully! We will contact you at your linked account email.' 
        : 'Feedback submitted successfully! Thank you for helping shape WHISPRR.';
      
      showToast(successMsg, 'success');
      setFeedbackTitle('');
      setFeedbackDesc('');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit. Please try again.', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const blogCategories = ['All', 'Founder Journal', 'Product Update', 'Technical Article', 'Privacy Update'];
  const filteredArticles = activeBlogCategory === 'All' 
    ? ARTICLES 
    : ARTICLES.filter(a => a.category === activeBlogCategory);

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 text-warm-900 dark:text-warm-100 flex flex-col font-sans transition-colors duration-300 selection:bg-primary-500/20">
      {/* Build in Public Alert Banner */}
      <div className="bg-primary-50 dark:bg-primary-950/40 border-b border-primary-100 dark:border-primary-900/30 text-center py-2 px-4 text-xs font-semibold text-primary-850 dark:text-primary-300">
        🚧 WHISPRR is being built in public. Every update, every feature, and every improvement is shared with our community because we believe great platforms are built together.
      </div>
      
      {/* Premium Glassmorphism Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-warm-900/80 backdrop-blur-md border-b border-warm-200/50 dark:border-warm-800/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveSection('home')}>
            <Logo size={36} />
            <div>
              <span className="font-serif text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent tracking-wide">
                WHISPRR
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-warm-200 dark:bg-warm-800 text-warm-650 dark:text-warm-400 px-2 py-0.5 rounded-full ml-2 font-bold">
                Ecosystem
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold select-none">
            {([
              { key: 'home' as LandingSection, label: 'Home' },
              { key: 'about' as LandingSection, label: 'Philosophy' },
              { key: 'building' as LandingSection, label: 'Building WHISPRR' },
              { key: 'updates' as LandingSection, label: 'Founder Journal & Blog' },
              { key: 'beta' as LandingSection, label: 'Beta Program' },
              { key: 'connect' as LandingSection, label: 'Connect' }
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`transition-colors py-1 ${
                  activeSection === tab.key
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                    : 'text-warm-500 hover:text-warm-850 dark:hover:text-warm-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary py-2 px-5 text-sm font-bold flex items-center gap-1.5"
            >
              Join WHISPRR <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Section Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        
        {/* HOMEPAGE */}
        {activeSection === 'home' && (
          <div className="space-y-16 animate-fade-in">
            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row items-center gap-10 py-8 relative">
              <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
              </div>

              <div className="flex-1 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>An Open Project Story</span>
                </div>
                
                <h1 className="text-4xl sm:text-6xl font-serif font-bold text-warm-900 dark:text-warm-50 leading-tight tracking-tight">
                  Where connections <br className="hidden md:inline" />
                  <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">feel real.</span>
                </h1>
                
                <p className="text-warm-600 dark:text-warm-300 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                  WHISPRR is a thoughtful network built for authentic conversations, close-knit communities, 
                  and organic interest matching. Designed to respect your time and nurture real connections.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => navigate('/auth')}
                    className="btn-primary py-3 px-8 text-base font-bold shadow-soft"
                  >
                    Join WHISPRR
                  </button>

                </div>
              </div>

              {/* Mockup Preview */}
              <div className="flex-1 w-full max-w-sm mx-auto relative flex justify-center">
                 <div className="w-72 h-[30rem] bg-warm-100 dark:bg-warm-850 rounded-[2.2rem] border-8 border-warm-800 dark:border-warm-700 shadow-float relative overflow-hidden flex flex-col">
                   <div className="w-20 h-4 bg-warm-800 dark:bg-warm-700 rounded-full mx-auto mt-3" />
                   
                   <div className="flex-1 p-6 flex flex-col justify-between mt-4">
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1.5">
                            <Logo size={24} />
                            <span className="font-serif font-bold text-xs text-warm-900 dark:text-warm-100">WHISPRR</span>
                         </div>
                         <span className="text-[8px] bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold px-1.5 py-0.5 rounded">ONLINE</span>
                       </div>
                       
                       <div className="p-3.5 bg-white dark:bg-warm-800 rounded-2xl border border-warm-200/50 dark:border-warm-800/40 shadow-sm space-y-2">
                         <div className="flex items-center gap-1">
                            <span className="text-[10px]">👑</span>
                            <span className="font-bold text-[10px] text-warm-900 dark:text-warm-100">nyny59</span>
                            <span className="text-[8px] bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold px-1 rounded-full">FOUNDER</span>
                         </div>
                         <p className="text-[10px] text-warm-650 dark:text-warm-300 leading-relaxed font-medium">
                           We designed WHISPRR to be a human social grid. No metrics traps, just real conversations.
                         </p>
                       </div>
                     </div>

                     <div className="space-y-1.5 pt-4 border-t border-warm-200/50 dark:border-warm-800/40">
                        <p className="text-[9px] text-warm-500 text-center">Ready to explore?</p>
                        <div className="w-full py-1.5 bg-primary-500 text-white text-center rounded-xl text-[9px] font-bold cursor-pointer" onClick={() => navigate('/auth')}>
                           Launch Platform
                        </div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            {/* Mission & Vision cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
               <div className="public-card p-8 space-y-3">
                  <span className="text-primary-400 font-bold text-xs uppercase tracking-wider block">Our Mission</span>
                  <h3 className="font-serif text-2xl font-bold text-warm-50">Empowering human agency</h3>
                  <p className="text-sm text-warm-400 leading-relaxed">
                     To design and build a communication architecture that serves user dialogue rather than corporate interest.
                     We construct systems that support mindful interaction, intellectual safety, and decentralized community creation.
                  </p>
               </div>

               <div className="public-card p-8 space-y-3">
                  <span className="text-accent-400 font-bold text-xs uppercase tracking-wider block">Our Vision</span>
                  <h3 className="font-serif text-2xl font-bold text-warm-50">A healthier social web</h3>
                  <p className="text-sm text-warm-400 leading-relaxed">
                     A digital town square where members collaborate without addictive infinite loops, where trust is built through
                     history and mutual responsibility, and where identity is earned, meaningful, and secure.
                  </p>
               </div>
            </div>

            {/* Core Values Section */}
            <div className="space-y-6">
               <h3 className="font-serif text-xl font-bold text-center text-warm-900 dark:text-warm-50">WHISPRR Core Values</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {([
                     { title: 'Agency First', desc: 'You control what you view, when you view it, and who you connect with.' },
                     { title: 'Built in Public', desc: 'Full development transparency, open roadmaps, and community votes.' },
                     { title: 'Zero Extraction', desc: 'No surveillance business models, ad tracking networks, or infinite feeds.' },
                     { title: 'Responsibility', desc: 'Moderators and creators own and guide their community guidelines.' }
                  ]).map((val, i) => (
                     <div key={i} className="public-card p-5">
                        <h4 className="font-bold text-sm text-warm-50 mb-1">{val.title}</h4>
                        <p className="text-xs text-warm-400 leading-relaxed">{val.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* PHILOSOPHY & ABOUT */}
        {activeSection === 'about' && (
          <div className="max-w-2xl mx-auto space-y-12 animate-fade-in">
             <div className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">Our Philosophy & Approach</h2>
                <p className="text-base text-warm-600 dark:text-warm-300 leading-relaxed">
                   Existing platforms are designed to keep you online as long as possible. The longer you scroll, the more ads they show. 
                   This model leads to clickbait, polarization, and stress. 
                   We reject this design loop.
                </p>
             </div>

             <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-200 dark:border-warm-800/40 pb-2">
                   How WHISPRR is Different
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <h4 className="font-bold text-sm text-primary-600 dark:text-primary-400">No Infinite Doomscroll</h4>
                      <p className="text-xs text-warm-650 dark:text-warm-400 leading-relaxed">
                         Feeds are finite and organized by specific interests. WHISPRR suggests connections based on mutual interests and community logs, not outrage.
                      </p>
                   </div>
                   
                   <div className="space-y-2">
                      <h4 className="font-bold text-sm text-primary-600 dark:text-primary-400">Trust-Based Identity</h4>
                      <p className="text-xs text-warm-650 dark:text-warm-400 leading-relaxed">
                         Our Badge System validates role responsibility (e.g. Creator, Founder, Supporter, Moderator) so you know exactly who you are speaking with.
                      </p>
                   </div>

                   <div className="space-y-2">
                      <h4 className="font-bold text-sm text-primary-600 dark:text-primary-400">Creator Autonomy</h4>
                      <p className="text-xs text-warm-650 dark:text-warm-400 leading-relaxed">
                         Communities are completely controlled by their creators. Moderators enforce guidelines, assign helper badges, and analyze member trends.
                      </p>
                   </div>

                   <div className="space-y-2">
                      <h4 className="font-bold text-sm text-primary-600 dark:text-primary-400">Strict Privacy Focus</h4>
                      <p className="text-xs text-warm-650 dark:text-warm-400 leading-relaxed">
                         Conversations belong to you. We do not package or sell data profiles to third-party ad networks.
                      </p>
                   </div>
                </div>
             </div>

             <div className="p-6 bg-primary-50/50 dark:bg-primary-950/15 border border-primary-100 dark:border-primary-900/30 rounded-3xl flex items-start gap-4">
                <Info size={20} className="text-primary-500 shrink-0 mt-0.5" />
                <div>
                   <h4 className="font-serif font-bold text-sm text-warm-900 dark:text-warm-100">Project Integrity Statement</h4>
                   <p className="text-xs text-warm-600 dark:text-warm-400 mt-1 leading-relaxed">
                      WHISPRR’ backend and interface designs are built openly. We believe in providing clear tools 
                      so that users feel in control of their digital interactions.
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* BUILDING WHISPRR (Roadmap, Journey, Changelog, Feedback) */}
        {activeSection === 'building' && (
          <div className="space-y-12 animate-fade-in">
             <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">Building WHISPRR</h2>
                <p className="text-sm text-warm-500">Track our roadmap progress, public release notes, and timeline milestones.</p>
             </div>

             {/* Roadmap section */}
             <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800/40 pb-2">
                   Public Roadmap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                   {/* Released */}
                   <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase pb-1 border-b border-emerald-500/20">
                         <CheckCircle size={13} /> <span>Released</span>
                      </div>
                      <div className="space-y-2">
                         {ROADMAP_ITEMS.filter(r => r.status === 'released').map((item, idx) => (
                            <div key={idx} className="public-card-status border-emerald-800/40 p-2.5 text-xs leading-tight">
                               <p className="font-bold text-warm-900 dark:text-warm-150 flex items-center justify-between gap-1.5">
                                 <span>{item.title}</span>
                                 <span className="text-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold px-1.5 rounded shrink-0">✓</span>
                               </p>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* In Progress */}
                   <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-orange-500 font-bold uppercase pb-1 border-b border-orange-500/20">
                         <Clock size={13} className="animate-pulse" /> <span>In Progress</span>
                      </div>
                      <div className="space-y-2">
                         {ROADMAP_ITEMS.filter(r => r.status === 'in_progress').map((item, idx) => (
                            <div key={idx} className="public-card-status border-amber-800/40 p-2.5 text-xs leading-tight">
                               <p className="font-bold text-warm-900 dark:text-warm-150 flex items-center justify-between gap-1.5">
                                 <span>{item.title}</span>
                                 <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping shrink-0" />
                               </p>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Testing */}
                   <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-purple-500 font-bold uppercase pb-1 border-b border-purple-500/20">
                         <AlertCircle size={13} /> <span>Testing</span>
                      </div>
                      <div className="space-y-2">
                         {ROADMAP_ITEMS.filter(r => r.status === 'testing').map((item, idx) => (
                            <div key={idx} className="public-card-status border-purple-800/40 p-2.5 text-xs leading-tight">
                               <p className="font-bold text-warm-900 dark:text-warm-150 flex items-center justify-between gap-1.5">
                                 <span>{item.title}</span>
                                 <span className="text-[8px] bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold px-1.5 rounded shrink-0">🧪</span>
                               </p>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Planned */}
                   <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-blue-500 font-bold uppercase pb-1 border-b border-blue-500/20">
                         <Eye size={13} /> <span>Planned</span>
                      </div>
                      <div className="space-y-2">
                         {ROADMAP_ITEMS.filter(r => r.status === 'planned').map((item, idx) => (
                            <div key={idx} className="public-card-status border-blue-800/40 p-2.5 text-xs leading-tight">
                               <p className="font-bold text-warm-900 dark:text-warm-150 flex items-center justify-between gap-1.5">
                                 <span>{item.title}</span>
                                 <span className="text-[8px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold px-1.5 rounded shrink-0">Planned</span>
                               </p>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Future Vision */}
                   <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-pink-500 font-bold uppercase pb-1 border-b border-pink-500/20">
                         <Sparkles size={13} /> <span>Vision</span>
                      </div>
                      <div className="space-y-2">
                         {ROADMAP_ITEMS.filter(r => r.status === 'future_vision').map((item, idx) => (
                            <div key={idx} className="public-card-status border-pink-800/40 p-2.5 text-xs leading-tight">
                               <p className="font-bold text-warm-900 dark:text-warm-150 flex items-center justify-between gap-1.5">
                                 <span>{item.title}</span>
                                 <span className="text-[8px] bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 font-bold px-1.5 rounded shrink-0">✨</span>
                               </p>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             {/* Journey Timeline */}
             <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800/40 pb-2">
                   Product Journey
                </h3>
                <div className="relative pl-6 md:pl-0 border-l md:border-l-0 md:flex md:flex-row md:justify-between md:items-start border-warm-250 dark:border-warm-800 space-y-6 md:space-y-0 py-6">
                   {/* Horizontal track line for desktop */}
                   <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-primary-500 to-warm-300 dark:to-warm-700 -translate-y-1/2 hidden md:block" />
                   
                   {TIMELINE.map((item, idx) => {
                      const isCompleted = idx < 5; // First 5 items (Beta through Badge System) are active/completed
                      return (
                         <div key={idx} className="relative md:flex-1 md:text-center px-4 group">
                            {/* Marker dot */}
                            <div className={`absolute left-[-29px] md:left-1/2 md:top-1/2 md:-translate-y-1/2 md:-translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-soft z-10 transition-transform group-hover:scale-110 ${
                               isCompleted 
                                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/40' 
                                  : 'bg-warm-200 dark:bg-warm-800 text-warm-500 border-2 border-warm-350 dark:border-warm-700'
                            }`}>
                               {item.icon}
                            </div>
                            
                            {/* Content box */}
                            <div className={`p-4 bg-white dark:bg-warm-800 rounded-2xl border text-left shadow-soft inline-block md:w-full md:mt-8 relative transition-all ${
                               isCompleted 
                                  ? 'border-emerald-500/20 dark:border-emerald-500/30' 
                                  : 'border-warm-150 dark:border-warm-800/40 opacity-75'
                            }`}>
                               <span className={`text-[8px] font-bold uppercase tracking-wider block mb-0.5 ${
                                  isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-warm-450'
                               }`}>
                                  {isCompleted ? 'Active Epoch' : 'Upcoming Stage'}
                               </span>
                               <p className="font-serif font-bold text-xs text-warm-900 dark:text-warm-100">{item.title}</p>
                               <p className="text-[10px] text-warm-500 mt-1 leading-relaxed">{item.description}</p>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>

             {/* Public Changelog */}
             <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800/40 pb-2">
                   Public Changelog
                </h3>
                <div className="space-y-6">
                   {CHANGELOGS.map((ch, idx) => (
                      <div key={idx} className="public-card p-6 rounded-2xl space-y-4">
                         <div className="flex items-center justify-between p-3.5 public-card-secondary rounded-2xl border border-warm-100 dark:border-warm-800/40">
                            <div>
                               <span className="font-bold text-lg text-warm-900 dark:text-warm-50">{ch.version}</span>
                               <span className="text-xs text-warm-500 ml-2">({ch.date})</span>
                            </div>
                            <span className="text-[9px] bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold px-2.5 py-0.5 rounded-full">STABLE</span>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs leading-relaxed">
                            <div className="space-y-1">
                               <p className="font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wide">New Features</p>
                               <ul className="list-disc list-inside space-y-0.5 text-warm-600 dark:text-warm-400">
                                  {ch.newFeatures.map((f, i) => <li key={i}>{f}</li>)}
                               </ul>
                            </div>
                            <div className="space-y-1">
                               <p className="font-bold text-primary-500 uppercase tracking-wide">Improvements</p>
                               <ul className="list-disc list-inside space-y-0.5 text-warm-600 dark:text-warm-400">
                                  {ch.improvements.map((f, i) => <li key={i}>{f}</li>)}
                               </ul>
                            </div>
                            <div className="space-y-1">
                               <p className="font-bold text-red-500 uppercase tracking-wide">Bug Fixes</p>
                               <ul className="list-disc list-inside space-y-0.5 text-warm-600 dark:text-warm-400">
                                  {ch.bugFixes.map((f, i) => <li key={i}>{f}</li>)}
                               </ul>
                            </div>
                            <div className="space-y-1">
                               <p className="font-bold text-purple-500 uppercase tracking-wide">Performance</p>
                               <ul className="list-disc list-inside space-y-0.5 text-warm-600 dark:text-warm-400">
                                  {ch.performance.map((f, i) => <li key={i}>{f}</li>)}
                               </ul>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Community Feedback Impact logs */}
             <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800/40 pb-2">
                   Community Feedback Impact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {FEEDBACK_IMPACTS.map((f, idx) => (
                      <article key={idx} className="public-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
                         <div>
                            <p className="font-bold text-warm-900 dark:text-warm-100">{f.title}</p>
                            <p className="text-[10px] text-warm-500 mt-0.5">👍 {f.votes} community interest flags</p>
                         </div>
                         <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full self-start ${
                            f.status === 'implemented' || f.status === 'recently_completed'
                               ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                               : f.status === 'reviewing'
                               ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                               : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                         }`}>
                            {f.status.replace('_', ' ')}
                         </span>
                      </article>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* FOUNDER JOURNAL & BLOG */}
        {activeSection === 'updates' && (
          <div className="space-y-8 animate-fade-in">
             <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">Updates & Journal Logs</h2>
                <p className="text-sm text-warm-500">Read product announcements and the official Founder Journal.</p>
             </div>

             {/* Categories filter */}
             <div className="flex gap-2 pb-2 border-b border-warm-200 dark:border-warm-800 overflow-x-auto select-none">
                {blogCategories.map(cat => (
                   <button
                     key={cat}
                     onClick={() => setActiveBlogCategory(cat)}
                     className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        activeBlogCategory === cat
                           ? 'bg-primary-500 text-white shadow-soft'
                           : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-warm-200 dark:hover:bg-warm-750'
                     }`}
                   >
                      {cat}
                   </button>
                ))}
             </div>

             {/* Articles list */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((art, idx) => (
                   <article key={idx} className="public-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                         <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                            <span className="text-primary-500">{art.category}</span>
                            <span className="text-warm-500">{art.date}</span>
                         </div>
                         <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-100 leading-snug">
                            {art.title}
                         </h3>
                         <p className="text-xs text-warm-500 leading-relaxed">
                            {art.excerpt}
                         </p>
                      </div>
                      
                      {art.content && (
                         <div className="public-card-secondary p-3 text-xs italic text-warm-400">
                            {art.content}
                         </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-warm-100 dark:border-warm-800/40 text-[10px] text-warm-500">
                         <span className="font-semibold">By {art.author}</span>
                         <span>{art.readTime}</span>
                      </div>
                   </article>
                ))}
             </div>
          </div>
        )}

        {/* BETA PROGRAM & FEEDBACK */}
        {activeSection === 'beta' && (
          <div className="space-y-12 animate-fade-in">
             <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">Beta Program & Recognition</h2>
                <p className="text-sm text-warm-500">Join our testers, view program rewards, and check community recognition walls.</p>
             </div>

             {/* Grid detailing rules, rewards, and recognitions */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Guidelines */}
                <div className="public-card p-6 rounded-2xl space-y-3">
                   <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/20 text-primary-500 flex items-center justify-center">
                      <Shield size={16} />
                   </div>
                   <h4 className="font-bold text-sm text-warm-900 dark:text-warm-100">Beta Guidelines</h4>
                   <ul className="text-xs text-warm-500 space-y-1.5 list-disc list-inside leading-relaxed">
                      <li>Be respectful and authentic.</li>
                      <li>Report all security gaps immediately.</li>
                      <li>Focus posts on real value interests.</li>
                      <li>Engage constructively with reviews.</li>
                   </ul>
                </div>

                {/* Rewards */}
                <div className="public-card p-6 rounded-2xl space-y-3">
                   <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/20 text-primary-500 flex items-center justify-center">
                      <Award size={16} />
                   </div>
                   <h4 className="font-bold text-sm text-warm-900 dark:text-warm-100">Beta Rewards</h4>
                   <ul className="text-xs text-warm-500 space-y-1.5 list-disc list-inside leading-relaxed">
                      <li>Permanent <strong>🌱 Early Supporter</strong> badge.</li>
                      <li>Early access to future AI characters features.</li>
                      <li>Create and manage custom communities first.</li>
                      <li>Direct access to Founder feedback loops.</li>
                   </ul>
                </div>

                {/* Contributors */}
                <div className="public-card p-6 rounded-2xl space-y-3">
                   <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/20 text-primary-500 flex items-center justify-center">
                      <Users size={16} />
                   </div>
                   <h4 className="font-bold text-sm text-warm-900 dark:text-warm-100">Community Recognition</h4>
                   <div className="text-[10px] text-warm-500 space-y-1 leading-relaxed">
                      <p><strong>Early Supporters:</strong> nyny59, alice_w, developer_bob</p>
                      <p><strong>Beta Testers:</strong> tester_01, feedback_fanatic, bug_hunter</p>
                      <p><strong>Community Contributors:</strong> artist_pro, voice_pioneer</p>
                      <p className="text-[8px] italic text-warm-450 mt-1">Thank you for building WHISPRR with us!</p>
                   </div>
                </div>

             </div>

             {/* Feedback Form & Applications block */}
             <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start pt-4">
                <div className="md:col-span-3 public-card p-6 rounded-2xl space-y-4">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-100 border-b border-warm-100 dark:border-warm-800/40 pb-2">
                      Submit Feedback / Apply
                   </h4>
                   <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-semibold text-warm-700 dark:text-warm-300">Category</label>
                         <select
                           value={feedbackType}
                           onChange={e => setFeedbackType(e.target.value as any)}
                           className="bg-warm-925 border border-white/[0.06] text-xs px-2.5 py-2 rounded-xl text-warm-700 dark:text-warm-200 outline-none w-full"
                         >
                            <option value="ux">UX / Design Suggestion</option>
                            <option value="feature">Feature Request</option>
                            <option value="bug">Report Bug</option>
                            <option value="beta">Apply for Beta Testing</option>
                         </select>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-semibold text-warm-700 dark:text-warm-300">Title</label>
                         <input 
                           type="text"
                           value={feedbackTitle}
                           onChange={e => setFeedbackTitle(e.target.value)}
                           placeholder="Short summary..."
                           className="input-field text-xs py-2 px-3"
                           required
                         />
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-semibold text-warm-700 dark:text-warm-300">Details / Description</label>
                         <textarea
                           value={feedbackDesc}
                           onChange={e => setFeedbackDesc(e.target.value)}
                           placeholder="Details, email to contact, or application statement..."
                           className="input-field text-xs py-2 px-3 min-h-24"
                           required
                         />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingFeedback}
                        className="btn-primary py-2 px-6 font-bold flex items-center justify-center gap-1.5 text-xs"
                      >
                         {submittingFeedback ? 'Submitting...' : 'Submit'} <Send size={12} />
                      </button>
                   </form>
                </div>

                <div className="md:col-span-2 public-card-secondary p-6 space-y-3">
                   <h4 className="font-serif text-sm font-bold text-warm-900 dark:text-warm-100">Beta Rewards & Badges</h4>
                   <p className="text-xs text-warm-600 dark:text-warm-400 leading-relaxed">
                      Accepted beta applicants will have the <strong>🌱 Early Supporter</strong> badge assigned to their profiles. 
                      You can trace your badge status in the main platform and watch your historical timeline grow!
                   </p>
                </div>
             </div>
           </div>
        )}

        {/* CONNECT — Community Hub */}
        {activeSection === 'connect' && (
          <div className="space-y-12 animate-fade-in">
             <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full">
                   <Globe size={12} />
                   <span>Community Hub</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50">Connect</h2>
                <p className="text-base text-warm-500 dark:text-warm-400 leading-relaxed">
                   Discover every way to become part of WHISPRR.
                   Join the community, follow development, share ideas, and help shape the future.
                </p>
             </div>

             {/* Primary: Discord */}
             <div className="public-card p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 to-transparent pointer-events-none" />
                <div className="relative flex flex-col md:flex-row items-center gap-8">
                   <div className="w-20 h-20 bg-[#5865F2] rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
                         <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.227-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                      </svg>
                   </div>
                   <div className="flex-1 text-center md:text-left space-y-2">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                         <h3 className="font-serif text-2xl font-bold text-warm-50">Official Discord Community</h3>
                         <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300">Coming Soon</span>
                      </div>
                      <p className="text-sm text-warm-400 leading-relaxed max-w-lg">
                         Meet other members, receive development updates, join beta testing, report bugs,
                         suggest features, participate in events, and talk directly with the team.
                      </p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-[10px] text-warm-500">
                         <span>📢 Announcements</span>
                         <span>🧪 Beta Testing</span>
                         <span>🐛 Bug Reports</span>
                         <span>💡 Feature Requests</span>
                         <span>🌍 Country Spaces</span>
                         <span>🎉 Events</span>
                      </div>
                   </div>
                   <button
                     disabled
                     className="bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 font-bold py-3 px-8 rounded-2xl text-sm flex items-center gap-2 opacity-60 cursor-not-allowed shrink-0"
                   >
                     Join Discord <ExternalLink size={14} />
                   </button>
                </div>
             </div>

             {/* Grid of Community Hub cards */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    icon: <Map size={20} />,
                    title: 'Public Roadmap',
                    desc: 'See what has been released, what is being built, and what is planned for the future.',
                    status: 'available',
                    action: () => setActiveSection('building'),
                    actionLabel: 'View Roadmap',
                    accent: 'text-blue-400',
                    accentBg: 'bg-blue-500/10 border-blue-800/30',
                  },
                  {
                    icon: <PenTool size={20} />,
                    title: 'Founder Journal',
                    desc: 'Follow the development journey. Read behind-the-scenes updates and important milestones.',
                    status: 'available',
                    action: () => setActiveSection('updates'),
                    actionLabel: 'Read Journal',
                    accent: 'text-purple-400',
                    accentBg: 'bg-purple-500/10 border-purple-800/30',
                  },
                  {
                    icon: <Megaphone size={20} />,
                    title: 'Public Changelog',
                    desc: 'Discover every new release, feature improvement, and bug fix.',
                    status: 'available',
                    action: () => setActiveSection('building'),
                    actionLabel: 'View Changelog',
                    accent: 'text-green-400',
                    accentBg: 'bg-green-500/10 border-green-800/30',
                  },
                  {
                    icon: <FlaskConical size={20} />,
                    title: 'Beta Program',
                    desc: 'Apply for beta testing. Download preview versions. Help shape the future of WHISPRR.',
                    status: 'available',
                    action: () => setActiveSection('beta'),
                    actionLabel: 'Join Beta',
                    accent: 'text-amber-400',
                    accentBg: 'bg-amber-500/10 border-amber-800/30',
                  },
                  {
                    icon: <Lightbulb size={20} />,
                    title: 'Feature Requests',
                    desc: 'Suggest new ideas. Vote on community suggestions. See which requests are being reviewed.',
                    status: 'available',
                    action: () => setActiveSection('building'),
                    actionLabel: 'Suggest Ideas',
                    accent: 'text-pink-400',
                    accentBg: 'bg-pink-500/10 border-pink-800/30',
                  },
                  {
                    icon: <Bug size={20} />,
                    title: 'Report a Bug',
                    desc: 'Report problems. Track bug status. Receive updates when bugs are fixed.',
                    status: 'available',
                    action: () => setActiveSection('beta'),
                    actionLabel: 'Report Bug',
                    accent: 'text-red-400',
                    accentBg: 'bg-red-500/10 border-red-800/30',
                  },
                  {
                    icon: <FileText size={20} />,
                    title: 'Product Journey',
                    desc: 'Explore the complete evolution of WHISPRR from idea to ecosystem.',
                    status: 'available',
                    action: () => navigate('/building'),
                    actionLabel: 'Explore Journey',
                    accent: 'text-cyan-400',
                    accentBg: 'bg-cyan-500/10 border-cyan-800/30',
                  },
                  {
                    icon: <HelpCircle size={20} />,
                    title: 'Help Center',
                    desc: 'Frequently asked questions. Support articles. Account and privacy help.',
                    status: 'coming_soon',
                    action: undefined,
                    actionLabel: 'Coming Soon',
                    accent: 'text-indigo-400',
                    accentBg: 'bg-indigo-500/10 border-indigo-800/30',
                  },
                  {
                    icon: <Lock size={20} />,
                    title: 'Trust & Privacy',
                    desc: 'Privacy Policy. Terms of Service. Community Guidelines. Safety Center.',
                    status: 'available',
                    action: () => navigate('/trust'),
                    actionLabel: 'View Policies',
                    accent: 'text-emerald-400',
                    accentBg: 'bg-emerald-500/10 border-emerald-800/30',
                  },
                ].map((card, idx) => (
                  <div key={idx} className={`public-card p-6 space-y-4 ${card.accentBg} hover:scale-[1.01] transition-transform`}>
                     <div className="flex items-center justify-between">
                        <div className={`${card.accent}`}>{card.icon}</div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                           card.status === 'available'
                             ? 'bg-emerald-900/40 text-emerald-300'
                             : card.status === 'coming_soon'
                             ? 'bg-amber-900/40 text-amber-300'
                             : 'bg-blue-900/40 text-blue-300'
                        }`}>
                           {card.status === 'available' ? 'Available' : card.status === 'coming_soon' ? 'Coming Soon' : 'Beta'}
                        </span>
                     </div>
                     <div>
                        <h4 className="font-serif font-bold text-base text-warm-50 mb-1">{card.title}</h4>
                        <p className="text-xs text-warm-400 leading-relaxed">{card.desc}</p>
                     </div>
                     <button
                       onClick={card.action}
                       disabled={!card.action}
                       className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${
                         card.action
                           ? `${card.accent} hover:opacity-80`
                           : 'text-warm-600 cursor-not-allowed'
                       }`}
                     >
                       {card.actionLabel} <ChevronRight size={12} />
                     </button>
                  </div>
                ))}
             </div>

             {/* Ecosystem Vision */}
             <div className="public-card-secondary p-8 rounded-3xl text-center space-y-4">
                <h3 className="font-serif text-xl font-bold text-warm-100">The WHISPRR Ecosystem</h3>
                <p className="text-sm text-warm-400 leading-relaxed max-w-2xl mx-auto">
                   As WHISPRR grows, this hub will connect every part of the ecosystem — 
                   iOS & Android apps, Developer API, Creator Center, Partner Program, 
                   Ambassador Program, and global communities. 
                   Everything connected through one unified experience.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                   {['📱 Mobile Apps', '🛠 Developer API', '🎨 Creator Center', '🤝 Partners', '🌍 Global Communities', '📚 Documentation'].map((item, i) => (
                     <span key={i} className="text-[10px] text-warm-500 bg-warm-950 border border-white/[0.06] px-3 py-1 rounded-full">{item}</span>
                   ))}
                </div>
             </div>
          </div>
        )}

      </main>

      {/* ════════════════════════════════════════════════════════════
          BEYOND WHISPRR  —  Always-visible closing section
          ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-20">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <Globe size={12} />
            <span>Long-term Aspirations</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-warm-900 dark:text-warm-50 mb-4">
            🌍 Beyond WHISPRR
          </h2>
          <p className="text-warm-500 dark:text-warm-400 text-base leading-relaxed">
            This is not a promise. It is the world we are working toward — together.
            Where WHISPRR hopes to be, not just as a product, but as a presence in people's lives.
          </p>
        </div>

        {/* Aspiration Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: '📱', title: 'Everywhere You Are',
              desc: 'Native iOS and Android. Desktop and tablet experiences. WHISPRR in your pocket, on every device.',
              gradient: 'from-violet-500/15 to-indigo-500/10', border: 'border-violet-200/50 dark:border-violet-900/40', accent: 'text-violet-600 dark:text-violet-400',
            },
            {
              icon: '🌍', title: 'A Truly Global Home',
              desc: 'Country Spaces for every nation. Dozens of languages. Real-time translation. A home for every culture.',
              gradient: 'from-cyan-500/15 to-blue-500/10', border: 'border-cyan-200/50 dark:border-cyan-900/40', accent: 'text-cyan-600 dark:text-cyan-400',
            },
            {
              icon: '🤝', title: 'Millions of Connections',
              desc: 'Millions of meaningful conversations. Healthy communities. Partnerships. Global events that unite people.',
              gradient: 'from-green-500/15 to-emerald-500/10', border: 'border-green-200/50 dark:border-green-900/40', accent: 'text-green-600 dark:text-green-400',
            },
            {
              icon: '🎨', title: 'Creators at the Center',
              desc: 'Creator profiles, analytics, and recognition. A platform where creators are celebrated, not suppressed.',
              gradient: 'from-orange-500/15 to-amber-500/10', border: 'border-orange-200/50 dark:border-orange-900/40', accent: 'text-orange-600 dark:text-orange-400',
            },
            {
              icon: '🤖', title: 'Intelligence That Connects',
              desc: 'AI Characters, AI Companions, AI Worlds, and AI Voice. Technology that augments human connection.',
              gradient: 'from-rose-500/15 to-pink-500/10', border: 'border-rose-200/50 dark:border-rose-900/40', accent: 'text-rose-600 dark:text-rose-400',
            },
            {
              icon: '🏛️', title: 'Institutions Welcome',
              desc: 'Universities, schools, non-profits, and businesses. A platform for organizations that build genuine community.',
              gradient: 'from-teal-500/15 to-cyan-500/10', border: 'border-teal-200/50 dark:border-teal-900/40', accent: 'text-teal-600 dark:text-teal-400',
            },
            {
              icon: '🛠️', title: 'Open to Builders',
              desc: 'Public API, Developer SDK, integrations, and plugins. An ecosystem built for users and the developers who extend it.',
              gradient: 'from-slate-500/15 to-zinc-500/10', border: 'border-slate-200/50 dark:border-slate-900/40', accent: 'text-slate-600 dark:text-slate-400',
            },
            {
              icon: '♿', title: 'Inclusive by Design',
              desc: 'Screen reader support, localization, real-time translation, and accessibility improvements. WHISPRR for everyone.',
              gradient: 'from-indigo-500/15 to-blue-500/10', border: 'border-indigo-200/50 dark:border-indigo-900/40', accent: 'text-indigo-600 dark:text-indigo-400',
            },
          ].map((card, idx) => (
            <div key={idx} className={`p-5 rounded-3xl border bg-gradient-to-br ${card.gradient} ${card.border} hover:scale-[1.02] transition-transform`}>
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className={`font-serif font-bold text-sm mb-2 ${card.accent}`}>{card.title}</h3>
              <p className="text-xs text-warm-600 dark:text-warm-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-warm-400 dark:text-warm-600 italic">
          These are aspirations, not promises. Features move to the public roadmap only when actively planned or in development.
        </p>

        {/* The Dream */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-950/90 via-warm-950 to-violet-950 p-10 md:p-14 border border-primary-800/30">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-400/5 rounded-full blur-2xl" />
          </div>

          <div className="relative max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="text-4xl mb-4">✨</div>
              <h2 className="font-serif text-3xl font-bold text-white mb-3">The Dream</h2>
              <p className="text-white/45 text-sm italic">
                This is not a roadmap. This is the long-term mission of WHISPRR.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {[
                { emoji: '🌱', text: 'Build the world\'s most human-centered social platform.' },
                { emoji: '🤝', text: 'Help people create genuine friendships across the globe.' },
                { emoji: '💬', text: 'Encourage meaningful conversations over empty engagement.' },
                { emoji: '🌍', text: 'Connect communities across cultures, languages, and borders.' },
                { emoji: '💜', text: 'Make social media feel human again — not transactional.' },
                { emoji: '🏡', text: 'Build a platform where people belong instead of competing for attention.' },
                { emoji: '✨', text: 'Create an ecosystem where technology strengthens human connection.' },
                { emoji: '🎯', text: 'Prove that a social platform can be ethical, joyful, and sustainable.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/8 transition-colors">
                  <span className="text-xl flex-shrink-0">{item.emoji}</span>
                  <p className="text-white/80 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Closing statement */}
            <div className="text-center border-t border-white/10 pt-10 space-y-4">
              <p className="text-white/80 text-xl md:text-2xl font-serif font-bold leading-relaxed">
                "The future of WHISPRR will be written together —
              </p>
              <p className="text-white/80 text-xl md:text-2xl font-serif font-bold leading-relaxed">
                with every conversation, every community, and every person who chooses to belong."
              </p>
              <p className="text-white/30 text-sm italic mt-6">
                This is only the beginning.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* Premium Footer */}
      <footer className="bg-warm-100 dark:bg-warm-950 border-t border-warm-200/50 dark:border-warm-800/40 py-10 mt-16 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 items-center text-center sm:text-left text-xs text-warm-500">
           <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                 <Logo size={24} />
                 <span className="font-serif font-bold text-sm text-warm-900 dark:text-warm-100">WHISPRR</span>
              </div>
              <p className="text-[10px] text-warm-450 dark:text-warm-505">Where connections feel real. Built in public since 2026.</p>
           </div>
           
           <div className="flex justify-center gap-4 text-warm-500 font-semibold select-none">
              <button onClick={() => navigate('/privacy')} className="hover:text-warm-700 dark:hover:text-warm-300">Privacy Policy</button>
              <button onClick={() => navigate('/terms')} className="hover:text-warm-700 dark:hover:text-warm-300">Terms of Use</button>
              <button onClick={() => navigate('/trust')} className="hover:text-warm-700 dark:hover:text-warm-300">Trust Guidelines</button>
           </div>

           <div className="sm:text-right text-[10px] space-y-1">
              <p>© 2026 WHISPRR. All rights reserved.</p>
              <p>Independent & Community Built.</p>
           </div>
        </div>
      </footer>
    </div>
  );
}
