import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, Construction, Calendar, GitCommit, Heart, Sparkles, MessageSquare, 
  MapPin, CheckCircle, Clock, Eye, AlertCircle, ArrowRight, Shield, Globe, 
  Smile, Share2, Compass, Layers, Send, ChevronRight, PenTool, BookOpen, Bug
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

type LandingSection = 'home' | 'about' | 'roadmap' | 'blog' | 'feedback';

interface BlogArticle {
  title: string;
  excerpt: string;
  date: string;
  category: 'Founder Log' | 'Development' | 'Milestone';
  author: string;
  readTime: string;
}

const ARTICLES: BlogArticle[] = [
  {
    title: 'Introducing WHISPRR: Social Media Without the Scroll',
    excerpt: 'Why we are building a platform focused on meaningful human connection rather than maximizing screen time and ad impressions.',
    date: 'June 28, 2026',
    category: 'Founder Log',
    author: 'nyny59',
    readTime: '5 min read'
  },
  {
    title: 'Under the Hood: The WHISPRR Interest Graph',
    excerpt: 'A deep dive into our discovery algorithms and how we recommend content based on authentic values, mutual topics, and community signals.',
    date: 'June 29, 2026',
    category: 'Development',
    author: 'Dev Team',
    readTime: '8 min read'
  },
  {
    title: 'Celebrating 1,000 Beta Members',
    excerpt: 'Reflecting on the private beta launch, the feedback received, and the road ahead as we prepare for the public launch.',
    date: 'June 24, 2026',
    category: 'Milestone',
    author: 'Community Team',
    readTime: '3 min read'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<LandingSection>('home');
  
  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'ux' | 'privacy' | 'community'>('ux');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      // Submit public feedback directly to DB. 
      // Since it is public, user_id can be null or we use a designated anonymous tag.
      const { error } = await supabase.from('feedback').insert({
        type: feedbackType,
        title: feedbackTitle,
        description: feedbackDesc,
        status: 'new'
      });
      if (error) throw error;
      showToast('Feedback submitted successfully! Thank you for helping shape WHISPRR.', 'success');
      setFeedbackTitle('');
      setFeedbackDesc('');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 text-warm-900 dark:text-warm-100 flex flex-col font-sans transition-colors duration-300 selection:bg-primary-500/20">
      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-warm-900/80 backdrop-blur-md border-b border-warm-200/50 dark:border-warm-800/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveSection('home')}>
            <Logo size={36} />
            <div>
              <span className="font-serif text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent tracking-wide">
                WHISPRR
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-warm-200 dark:bg-warm-800 text-warm-600 dark:text-warm-450 px-2 py-0.5 rounded-full ml-2 font-semibold">
                Project Home
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold select-none">
            {([
              { key: 'home' as LandingSection, label: 'Home' },
              { key: 'about' as LandingSection, label: 'About Project' },
              { key: 'roadmap' as LandingSection, label: 'Roadmap' },
              { key: 'blog' as LandingSection, label: 'Updates Log' },
              { key: 'feedback' as LandingSection, label: 'Participate' }
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

          <button
            onClick={() => navigate('/auth')}
            className="btn-primary py-2 px-5 text-sm font-bold flex items-center gap-1.5"
          >
            Launch Platform <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Section Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        
        {/* HOMEPAGE SECTION */}
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
                  <span>A Human-Centered Social Ecosystem</span>
                </div>
                
                <h1 className="text-4xl sm:text-6xl font-serif font-bold text-warm-900 dark:text-warm-50 leading-tight tracking-tight">
                  Where connections <br className="hidden md:inline" />
                  <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">feel real.</span>
                </h1>
                
                <p className="text-warm-600 dark:text-warm-300 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                  WHISPRR is a thoughtful network for authentic conversations, close-knit communities, 
                  and organic discovery. Built to respect your attention, prioritize trust, 
                  and reject addictive infinite scrolls.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => navigate('/auth')}
                    className="btn-primary py-3 px-8 text-base font-bold shadow-soft"
                  >
                    Join WHISPRR Today
                  </button>
                  <button
                    onClick={() => setActiveSection('about')}
                    className="btn-secondary py-3 px-6 text-base font-semibold"
                  >
                    Read Our Philosophy
                  </button>
                </div>
              </div>

              {/* Graphic Mockup */}
              <div className="flex-1 w-full max-w-md mx-auto relative flex justify-center">
                <div className="w-80 h-[32rem] bg-warm-150 dark:bg-warm-850 rounded-[2.5rem] border-8 border-warm-800 dark:border-warm-700 shadow-float relative overflow-hidden flex flex-col">
                  {/* Speaker slot */}
                  <div className="w-24 h-4 bg-warm-800 dark:bg-warm-700 rounded-full mx-auto mt-3" />
                  
                  {/* Inside App preview */}
                  <div className="flex-1 p-6 flex flex-col justify-between mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Logo size={28} />
                        <span className="font-serif font-bold text-sm text-warm-900 dark:text-warm-100">WHISPRR</span>
                      </div>
                      <div className="p-4 bg-white dark:bg-warm-800 rounded-2xl border border-warm-200/50 dark:border-warm-750 shadow-sm space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-primary-500 font-bold">
                          <span>👑 Founder</span>
                        </div>
                        <p className="text-xs text-warm-700 dark:text-warm-300 font-medium">
                          Welcome to WHISPRR! We are building a space where your presence is valued.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <div className="w-full h-8 bg-primary-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center">
                          Sign In / Register
                       </div>
                       <div className="w-full h-8 bg-warm-200 dark:bg-warm-700 text-warm-600 dark:text-warm-300 rounded-xl text-[10px] font-semibold flex items-center justify-center">
                          Explore Public Roadmap
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Values Segment */}
            <div className="space-y-8">
              <div className="text-center max-w-xl mx-auto">
                 <h2 className="text-2xl sm:text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">Our Core Principles</h2>
                 <p className="text-sm text-warm-500 mt-2">The guidelines driving every product and design decision we make.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {([
                   { icon: Shield, title: 'Trust & Verification', desc: 'Verified identities, moderator support, and dynamic role hierarchies that reward responsibility.' },
                   { icon: Globe, title: 'Decentralized Community', desc: 'Cozy interest circles where creators own their spaces, govern content, and moderate natively.' },
                   { icon: Smile, title: 'Mental Well-being', desc: 'No manipulative notification cycles, game mechanics, or algorithmic filters that exploit user screen time.' }
                 ]).map((val, idx) => {
                   const Icon = val.icon;
                   return (
                     <div key={idx} className="p-6 bg-white dark:bg-warm-800 rounded-3xl border border-warm-150 dark:border-warm-700 shadow-soft space-y-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-950/20 text-primary-500 flex items-center justify-center shrink-0">
                           <Icon size={20} />
                        </div>
                        <h4 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-100">{val.title}</h4>
                        <p className="text-xs text-warm-600 dark:text-warm-400 leading-relaxed">{val.desc}</p>
                     </div>
                   );
                 })}
              </div>
            </div>
          </div>
        )}

        {/* ABOUT SECTION */}
        {activeSection === 'about' && (
          <div className="space-y-12 animate-fade-in">
             <div className="max-w-2xl mx-auto space-y-8">
                <div className="space-y-3">
                   <h2 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">Why WHISPRR exists</h2>
                   <p className="text-base text-warm-600 dark:text-warm-300 leading-relaxed">
                     Social media has lost its soul. Today’s platforms are built as attention casinos—optimizing for 
                     ad views, outrage clickbait, and infinite doomscrolling. Users have been reduced to monetization 
                     profiles, and real connection has been replaced by metrics.
                   </p>
                </div>

                <div className="space-y-3">
                   <h3 className="text-xl font-serif font-bold text-warm-900 dark:text-warm-50">Our Philosophy</h3>
                   <p className="text-sm text-warm-600 dark:text-warm-300 leading-relaxed">
                     We believe a platform should be a tool that serves your life, not an addiction that consumes it. 
                     WHISPRR is designed around two main ideas: **respect** and **trust**.
                   </p>
                   <ul className="space-y-2 text-xs text-warm-600 dark:text-warm-400 pl-4 list-disc">
                      <li><strong>Attention Respect:</strong> No endless feed algorithmic loops. Discovery is driven by mutual interest graphs that you control.</li>
                      <li><strong>Identity Authenticity:</strong> Trust-based badge system that recognizes founders, moderators, beta testers, and mentors rather than simple popularity.</li>
                      <li><strong>Community Ownership:</strong> Creators have full moderation controls, community channels, and analytics dashboards to guide their spaces.</li>
                   </ul>
                </div>

                <div className="p-6 bg-warm-100 dark:bg-warm-850 rounded-3xl border border-warm-200/50 dark:border-warm-750/30">
                   <h4 className="font-serif font-bold text-warm-900 dark:text-warm-50 text-sm">Building WHISPRR since Day One</h4>
                   <p className="text-xs text-warm-500 mt-1 leading-relaxed">
                     WHISPRR is an independent project. We are not backed by venture funds looking for rapid extraction. 
                     We are building a platform that grows together with its community, supported by the members who believe in it.
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* ROADMAP SECTION */}
        {activeSection === 'roadmap' && (
          <div className="space-y-12 animate-fade-in">
             <div className="text-center max-w-xl mx-auto">
                <h2 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">Transparent Roadmap</h2>
                <p className="text-sm text-warm-500 mt-2">See exactly what is already live, what is currently being coded, and what is planned next.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Released */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 pb-2 border-b border-green-200 dark:border-green-900/40">
                      <CheckCircle size={16} className="text-green-500" />
                      <h4 className="font-serif font-bold text-sm text-warm-900 dark:text-warm-100">Released</h4>
                   </div>
                   <div className="space-y-3 text-xs">
                      {([
                         { title: 'User Profiles', desc: 'Custom profiles, bios, location metadata.' },
                         { title: 'Communities', desc: 'Interest groups with creator permissions.' },
                         { title: 'Direct Messages & Groups', desc: 'One-on-one and group messaging.' },
                         { title: 'Search & Explore', desc: 'Filter profiles and communities by interests.' }
                      ]).map((item, idx) => (
                         <div key={idx} className="p-4 bg-white dark:bg-warm-800 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-soft">
                            <h5 className="font-semibold text-warm-950 dark:text-warm-100">{item.title}</h5>
                            <p className="text-warm-500 mt-1">{item.desc}</p>
                         </div>
                      ))}
                   </div>
                </div>

                {/* In Progress */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 pb-2 border-b border-amber-200 dark:border-amber-900/40">
                      <Clock size={16} className="text-amber-500 animate-pulse" />
                      <h4 className="font-serif font-bold text-sm text-warm-900 dark:text-warm-100">In Progress</h4>
                   </div>
                   <div className="space-y-3 text-xs">
                      {([
                         { title: 'Badge & Identity System', desc: 'Historical timeline and role badges.' },
                         { title: 'Founder Dashboard', desc: 'Platform configurations and user moderation.' },
                         { title: 'Discovery Algorithms', desc: 'Balanced feed indexing and muted topics.' },
                         { title: 'Mobile settings menus', desc: 'Slide-down quick actions for mobile.' }
                      ]).map((item, idx) => (
                         <div key={idx} className="p-4 bg-white dark:bg-warm-800 rounded-2xl border border-amber-100 dark:border-amber-900/20 shadow-soft relative">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400/20" />
                            <h5 className="font-semibold text-warm-950 dark:text-warm-100">{item.title}</h5>
                            <p className="text-warm-500 mt-1">{item.desc}</p>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Planned */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 pb-2 border-b border-warm-250 dark:border-warm-700">
                      <Eye size={16} className="text-warm-400" />
                      <h4 className="font-serif font-bold text-sm text-warm-900 dark:text-warm-100">Planned</h4>
                   </div>
                   <div className="space-y-3 text-xs">
                      {([
                         { title: 'AI companion avatars', desc: 'Creating and chatting with custom AI characters.' },
                         { title: 'Roleplay Worlds', desc: 'Dedicated sandbox settings for shared writing.' },
                         { title: 'Character memory models', desc: 'Persistent chat context for AI characters.' },
                         { title: 'Audio & Voice features', desc: 'Drop-in voice chat channels.' }
                      ]).map((item, idx) => (
                         <div key={idx} className="p-4 bg-white dark:bg-warm-800 rounded-2xl border border-warm-150 dark:border-warm-700 shadow-soft">
                            <h5 className="font-semibold text-warm-950 dark:text-warm-100">{item.title}</h5>
                            <p className="text-warm-500 mt-1">{item.desc}</p>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* BLOG / UPDATES SECTION */}
        {activeSection === 'blog' && (
          <div className="space-y-10 animate-fade-in">
             <div className="text-center max-w-xl mx-auto">
                <h2 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">Updates Log</h2>
                <p className="text-sm text-warm-500 mt-2">Latest developer logs, platform milestones, and project journals.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ARTICLES.map((art, idx) => (
                   <article key={idx} className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-150 dark:border-warm-700 shadow-soft flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                         <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
                            <span className="text-primary-500">{art.category}</span>
                            <span className="text-warm-450">{art.date}</span>
                         </div>
                         <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-100 leading-snug">
                            {art.title}
                         </h3>
                         <p className="text-xs text-warm-500 leading-relaxed">
                            {art.excerpt}
                         </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-warm-100 dark:border-warm-750 text-[10px] text-warm-500">
                         <span>By {art.author}</span>
                         <span>{art.readTime}</span>
                      </div>
                   </article>
                ))}
             </div>
          </div>
        )}

        {/* FEEDBACK SECTION */}
        {activeSection === 'feedback' && (
          <div className="space-y-10 animate-fade-in">
             <div className="text-center max-w-xl mx-auto">
                <h2 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">Participate in WHISPRR</h2>
                <p className="text-sm text-warm-500 mt-2">Have suggestions, found a bug, or want to apply as a beta tester? We’d love to hear from you.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                {/* Form column */}
                <div className="md:col-span-3 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-150 dark:border-warm-700 shadow-soft">
                   <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-100 mb-4 border-b border-warm-100 dark:border-warm-750 pb-2">
                      Submit Feedback / Application
                   </h3>
                   <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-warm-700 dark:text-warm-300">Category</label>
                         <select
                           value={feedbackType}
                           onChange={e => setFeedbackType(e.target.value as any)}
                           className="bg-warm-50 dark:bg-warm-900 border border-warm-250 dark:border-warm-700 text-xs px-2.5 py-2 rounded-xl text-warm-700 dark:text-warm-200 outline-none w-full"
                         >
                            <option value="ux">UX / Design Suggestion</option>
                            <option value="feature">Feature Request</option>
                            <option value="bug">Report Bug</option>
                            <option value="privacy">Privacy Concern</option>
                            <option value="community">Beta Tester Application</option>
                         </select>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-warm-700 dark:text-warm-300">Title</label>
                         <input 
                           type="text"
                           value={feedbackTitle}
                           onChange={e => setFeedbackTitle(e.target.value)}
                           placeholder="Short summary of request..."
                           className="input-field text-xs py-2 px-3"
                           required
                         />
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-warm-700 dark:text-warm-300">Details / Description</label>
                         <textarea
                           value={feedbackDesc}
                           onChange={e => setFeedbackDesc(e.target.value)}
                           placeholder="Provide details, environment, steps to reproduce, or why you want to join beta..."
                           className="input-field text-xs py-2 px-3 min-h-32"
                           required
                         />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingFeedback}
                        className="btn-primary py-2 px-6 font-bold flex items-center justify-center gap-1.5 text-xs"
                      >
                         {submittingFeedback ? 'Submitting...' : 'Send Feedback'} <Send size={12} />
                      </button>
                   </form>
                </div>

                {/* Info column */}
                <div className="md:col-span-2 space-y-6">
                   <div className="p-5 bg-warm-100 dark:bg-warm-850 rounded-3xl border border-warm-200/50 dark:border-warm-750/30 space-y-3">
                      <h4 className="font-serif text-sm font-bold text-warm-900 dark:text-warm-100">Beta Testing Info</h4>
                      <p className="text-xs text-warm-600 dark:text-warm-400 leading-relaxed">
                         Beta accounts receive the permanent **🌱 Early Supporter** badge upon launch. Applications are processed manually.
                      </p>
                   </div>

                   <div className="p-5 bg-white dark:bg-warm-800 rounded-3xl border border-warm-150 dark:border-warm-700 shadow-soft space-y-3">
                      <h4 className="font-serif text-sm font-bold text-warm-900 dark:text-warm-100">Contact Details</h4>
                      <div className="text-xs text-warm-600 dark:text-warm-400 space-y-2">
                         <p><strong>Email:</strong> contact@whisprr.xyz</p>
                         <p><strong>Security:</strong> security@whisprr.xyz</p>
                         <p><strong>GitHub:</strong> github.com/diorix10-beep/WHISPRR-GITHUB</p>
                      </div>
                   </div>
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
