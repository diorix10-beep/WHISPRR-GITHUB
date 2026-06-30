import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, Calendar, GitCommit, Heart, Sparkles, MessageSquare, 
  CheckCircle, Clock, Eye, AlertCircle, ArrowRight, Shield, Globe, 
  Smile, Send, ChevronRight, PenTool, BookOpen, Bug, Award, Users, Info
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

type LandingSection = 'home' | 'about' | 'building' | 'updates' | 'beta';

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
  status: 'released' | 'in_progress' | 'planned' | 'future_vision';
  category: string;
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  { title: 'User Profiles', description: 'Rich profiles with custom interests, bios, and location metrics.', status: 'released', category: 'Core' },
  { title: 'Cozy Communities', description: 'Interest groups owned by creators with private custom settings.', status: 'released', category: 'Social' },
  { title: 'Direct Messages & Groups', description: 'Real-time messaging for close friends and groups.', status: 'released', category: 'Social' },
  { title: 'Search & Explore', description: 'Personalized filters for topics, tags, and profiles.', status: 'released', category: 'Discovery' },
  
  { title: 'Badge & Identity System', description: 'Verification tracks showing user responsibility timeline.', status: 'in_progress', category: 'Trust' },
  { title: 'Founder Dashboard', description: 'Controls for system maintenance bypass and feedback logs.', status: 'in_progress', category: 'Security' },
  { title: 'Discovery Algorithms', description: 'Interest-graph indexing prioritizing conversation quality.', status: 'in_progress', category: 'Discovery' },
  { title: 'Mobile Navigation Menu', description: 'Discord/Slack style slide-down quick actions.', status: 'in_progress', category: 'UX' },
  
  { title: 'AI Companion Characters', description: 'Customizable virtual friends with specific personality keys.', status: 'planned', category: 'AI' },
  { title: 'Roleplay Worlds', description: 'Collaborative rooms for creative writing and setup.', status: 'planned', category: 'Social' },
  { title: 'Character Memory Models', description: 'Allowing AI companions to build interaction history.', status: 'planned', category: 'AI' },
  { title: 'Audio & Voice Rooms', description: 'Drop-in channels for active voice conversations.', status: 'planned', category: 'Audio' },

  { title: 'Creator Monetization', description: 'Tips, premium community subscriptions, and lock boxes.', status: 'future_vision', category: 'Economy' },
  { title: 'Decentralized Server Sync', description: 'Self-hosted backend options syncing to the main cloud.', status: 'future_vision', category: 'Infrastructure' },
  { title: 'Collaborative Storytelling', description: 'Integrated markdown story trees for roleplayers.', status: 'future_vision', category: 'Social' },
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
              { key: 'beta' as LandingSection, label: 'Beta Program' }
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
              onClick={() => navigate('/')}
              className="hidden sm:inline-block text-xs font-bold text-warm-600 dark:text-warm-350 hover:text-warm-900 dark:hover:text-warm-50 transition-colors"
            >
              Open Platform
            </button>
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
                  <button
                    onClick={() => navigate('/')}
                    className="btn-secondary py-3 px-8 text-base font-bold"
                  >
                    Open Platform
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
                       
                       <div className="p-3.5 bg-white dark:bg-warm-800 rounded-2xl border border-warm-200/50 dark:border-warm-750 shadow-sm space-y-2">
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

                     <div className="space-y-1.5 pt-4 border-t border-warm-200/50 dark:border-warm-750">
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
               <div className="bg-white dark:bg-warm-800 p-8 rounded-3xl border border-warm-150 dark:border-warm-700 shadow-soft space-y-3">
                  <span className="text-primary-500 font-bold text-xs uppercase tracking-wider block">Our Mission</span>
                  <h3 className="font-serif text-2xl font-bold text-warm-900 dark:text-warm-50">Empowering human agency</h3>
                  <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
                     To design and build a communication architecture that serves user dialogue rather than corporate interest. 
                     We construct systems that support mindful interaction, intellectual safety, and decentralized community creation.
                  </p>
               </div>

               <div className="bg-white dark:bg-warm-800 p-8 rounded-3xl border border-warm-150 dark:border-warm-700 shadow-soft space-y-3">
                  <span className="text-accent-500 font-bold text-xs uppercase tracking-wider block">Our Vision</span>
                  <h3 className="font-serif text-2xl font-bold text-warm-900 dark:text-warm-50">A healthier social web</h3>
                  <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
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
                     <div key={i} className="p-5 bg-warm-100/40 dark:bg-warm-850/20 border border-warm-150 dark:border-warm-800 rounded-2xl">
                        <h4 className="font-bold text-sm text-warm-900 dark:text-warm-100 mb-1">{val.title}</h4>
                        <p className="text-xs text-warm-500 leading-relaxed">{val.desc}</p>
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
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-200 dark:border-warm-750 pb-2">
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
                      WHISPRR’s backend and interface designs are built openly. We believe in providing clear tools 
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
             <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                   Public Roadmap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   {/* Released */}
                   <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-green-500 font-bold uppercase pb-1 border-b border-green-200 dark:border-green-900/40">
                         <CheckCircle size={14} /> <span>Released</span>
                      </div>
                      <div className="space-y-2">
                         {ROADMAP_ITEMS.filter(r => r.status === 'released').map((item, idx) => (
                            <div key={idx} className="p-3 bg-white dark:bg-warm-800 rounded-xl border border-warm-150 dark:border-warm-700 text-xs shadow-sm">
                               <p className="font-bold text-warm-900 dark:text-warm-150">{item.title}</p>
                               <p className="text-warm-500 mt-0.5 leading-relaxed">{item.description}</p>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* In Progress */}
                   <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold uppercase pb-1 border-b border-amber-200 dark:border-amber-900/40">
                         <Clock size={14} className="animate-pulse" /> <span>In Progress</span>
                      </div>
                      <div className="space-y-2">
                         {ROADMAP_ITEMS.filter(r => r.status === 'in_progress').map((item, idx) => (
                            <div key={idx} className="p-3 bg-white dark:bg-warm-800 rounded-xl border border-amber-100 dark:border-amber-950/20 text-xs shadow-sm">
                               <p className="font-bold text-warm-900 dark:text-warm-150">{item.title}</p>
                               <p className="text-warm-500 mt-0.5 leading-relaxed">{item.description}</p>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Planned */}
                   <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-blue-500 font-bold uppercase pb-1 border-b border-blue-200 dark:border-blue-900/40">
                         <Eye size={14} /> <span>Planned</span>
                      </div>
                      <div className="space-y-2">
                         {ROADMAP_ITEMS.filter(r => r.status === 'planned').map((item, idx) => (
                            <div key={idx} className="p-3 bg-white dark:bg-warm-800 rounded-xl border border-warm-150 dark:border-warm-700 text-xs shadow-sm">
                               <p className="font-bold text-warm-900 dark:text-warm-150">{item.title}</p>
                               <p className="text-warm-500 mt-0.5 leading-relaxed">{item.description}</p>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Future Vision */}
                   <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-purple-500 font-bold uppercase pb-1 border-b border-purple-200 dark:border-purple-900/40">
                         <Sparkles size={14} /> <span>Future Vision</span>
                      </div>
                      <div className="space-y-2">
                         {ROADMAP_ITEMS.filter(r => r.status === 'future_vision').map((item, idx) => (
                            <div key={idx} className="p-3 bg-white dark:bg-warm-800 rounded-xl border border-warm-150 dark:border-warm-700 text-xs shadow-sm">
                               <p className="font-bold text-warm-900 dark:text-warm-150">{item.title}</p>
                               <p className="text-warm-500 mt-0.5 leading-relaxed">{item.description}</p>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             {/* Journey Timeline */}
             <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                   Product Journey
                </h3>
                <div className="relative pl-6 md:pl-0 border-l md:border-l-0 md:flex md:flex-row md:justify-between md:items-start border-warm-200 dark:border-warm-750 space-y-6 md:space-y-0 py-4">
                   <div className="absolute top-0 bottom-0 left-0 md:left-1/2 md:right-1/2 md:-translate-x-1/2 w-0.5 bg-warm-250 dark:bg-warm-750 hidden md:block" />
                   {TIMELINE.map((item, idx) => (
                      <div key={idx} className="relative md:flex-1 md:text-center px-4">
                         <div className="absolute left-[-29px] md:left-1/2 md:top-[-8px] md:-translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-warm-800 border-2 border-primary-500 flex items-center justify-center text-xs shadow-sm z-10">
                            {item.icon}
                         </div>
                         <div className="bg-white dark:bg-warm-800 p-4 rounded-xl border border-warm-150 dark:border-warm-700 shadow-sm inline-block text-left md:w-full md:mt-6">
                            <span className="text-[8px] font-bold text-primary-500 block mb-0.5">{item.date}</span>
                            <p className="font-bold text-xs text-warm-900 dark:text-warm-100">{item.title}</p>
                            <p className="text-[10px] text-warm-500 mt-0.5 leading-relaxed">{item.description}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Public Changelog */}
             <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                   Public Changelog
                </h3>
                <div className="space-y-6">
                   {CHANGELOGS.map((ch, idx) => (
                      <div key={idx} className="bg-white dark:bg-warm-800 p-6 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-sm space-y-4">
                         <div className="flex items-center justify-between pb-2 border-b border-warm-100 dark:border-warm-750">
                            <div>
                               <span className="font-bold text-lg text-warm-900 dark:text-warm-50">{ch.version}</span>
                               <span className="text-xs text-warm-500 ml-2">({ch.date})</span>
                            </div>
                            <span className="text-[9px] bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold px-2.5 py-0.5 rounded-full">STABLE</span>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs leading-relaxed">
                            <div className="space-y-1">
                               <p className="font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wide">New Features</p>
                               <ul className="list-disc list-inside space-y-0.5 text-warm-600 dark:text-warm-350">
                                  {ch.newFeatures.map((f, i) => <li key={i}>{f}</li>)}
                               </ul>
                            </div>
                            <div className="space-y-1">
                               <p className="font-bold text-primary-500 uppercase tracking-wide">Improvements</p>
                               <ul className="list-disc list-inside space-y-0.5 text-warm-600 dark:text-warm-350">
                                  {ch.improvements.map((f, i) => <li key={i}>{f}</li>)}
                               </ul>
                            </div>
                            <div className="space-y-1">
                               <p className="font-bold text-red-500 uppercase tracking-wide">Bug Fixes</p>
                               <ul className="list-disc list-inside space-y-0.5 text-warm-600 dark:text-warm-350">
                                  {ch.bugFixes.map((f, i) => <li key={i}>{f}</li>)}
                               </ul>
                            </div>
                            <div className="space-y-1">
                               <p className="font-bold text-purple-500 uppercase tracking-wide">Performance</p>
                               <ul className="list-disc list-inside space-y-0.5 text-warm-600 dark:text-warm-350">
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
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                   Community Feedback Impact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {FEEDBACK_IMPACTS.map((f, idx) => (
                      <div key={idx} className="p-4 bg-warm-100/50 dark:bg-warm-850/30 border border-warm-150 dark:border-warm-800 rounded-xl flex items-center justify-between text-xs">
                         <div>
                            <p className="font-bold text-warm-900 dark:text-warm-100">{f.title}</p>
                            <p className="text-[10px] text-warm-500 mt-0.5">👍 {f.votes} community interest flags</p>
                         </div>
                         <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            f.status === 'implemented' || f.status === 'recently_completed'
                               ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                               : f.status === 'reviewing'
                               ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                               : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                         }`}>
                            {f.status.replace('_', ' ')}
                         </span>
                      </div>
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
                   <article key={idx} className="bg-white dark:bg-warm-800 p-6 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-sm flex flex-col justify-between space-y-4">
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
                         <div className="p-3 bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 rounded-xl text-xs italic text-warm-600 dark:text-warm-400">
                            {art.content}
                         </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-warm-100 dark:border-warm-750 text-[10px] text-warm-500">
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
                <div className="bg-white dark:bg-warm-800 p-6 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-sm space-y-3">
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
                <div className="bg-white dark:bg-warm-800 p-6 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-sm space-y-3">
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
                <div className="bg-white dark:bg-warm-800 p-6 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-sm space-y-3">
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
                <div className="md:col-span-3 bg-white dark:bg-warm-800 p-6 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-sm space-y-4">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-100 border-b border-warm-100 dark:border-warm-750 pb-2">
                      Submit Feedback / Apply
                   </h4>
                   <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-semibold text-warm-700 dark:text-warm-300">Category</label>
                         <select
                           value={feedbackType}
                           onChange={e => setFeedbackType(e.target.value as any)}
                           className="bg-warm-50 dark:bg-warm-900 border border-warm-250 dark:border-warm-700 text-xs px-2.5 py-2 rounded-xl text-warm-700 dark:text-warm-200 outline-none w-full"
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

                <div className="md:col-span-2 p-6 bg-warm-100 dark:bg-warm-850 rounded-2xl border border-warm-200/50 dark:border-warm-750/30 space-y-3">
                   <h4 className="font-serif text-sm font-bold text-warm-900 dark:text-warm-100">Beta Rewards & Badges</h4>
                   <p className="text-xs text-warm-600 dark:text-warm-405 leading-relaxed">
                      Accepted beta applicants will have the <strong>🌱 Early Supporter</strong> badge assigned to their profiles. 
                      You can trace your badge status in the main platform and watch your historical timeline grow!
                   </p>
                </div>
             </div>
          </div>
        )}

      </main>

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
