import { useState } from 'react';
import { 
  Briefcase, Heart, Shield, Cpu, BookOpen, Clock, Bot, Sparkles, 
  CheckCircle, ArrowRight, X, FileText, Send, Award
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface JobPosition {
  id: string;
  title: string;
  department: 'Engineering' | 'Design' | 'AI' | 'Community' | 'Operations' | 'Marketing';
  location: string;
  type: string;
  overview: string;
  responsibilities: string[];
  qualifications: string[];
}

const OPEN_POSITIONS: JobPosition[] = [
  {
    id: 'fullstack-eng',
    title: 'Senior Fullstack Engineer (React & Supabase)',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    overview: 'Work closely with Atlas (our systems architect AI) to construct privacy-first social feeds, voice rooms, and dynamic caching configurations.',
    responsibilities: [
      'Maintain, optimize, and scale React components and Supabase database integrations.',
      'Construct realtime message sync and push notifications handlers.',
      'Refactor layouts for micro-animations and responsive breakpoints styling.'
    ],
    qualifications: [
      '5+ years experience building complex single-page apps with TypeScript and React.',
      'Strong SQL knowledge and experience writing secure Postgres Row Level Security (RLS) policies.',
      'Deep appreciation for clean, robust CSS and premium dark aesthetics.'
    ]
  },
  {
    id: 'ai-integration-eng',
    title: 'AI Integration Specialist (LLMs & Multi-Agents)',
    department: 'AI',
    location: 'Remote',
    type: 'Full-time',
    overview: 'Train, calibrate, and orchestrate the AI Family (Oracle, Iris, Aegis, Atlas, Athena) to collaborate autonomously on background tasks.',
    responsibilities: [
      'Implement multi-agent prompting techniques and persistent memory states.',
      'Reduce LLM response latencies and optimize token footprints.',
      'Integrate context vector databases with PostgreSQL client routines.'
    ],
    qualifications: [
      'Deep understanding of generative AI architectures and semantic search loops.',
      'Proficiency in Node.js, Python, and asynchronous API architectures.',
      'Appreciation for creating AI models that possess distinctive personas and roles.'
    ]
  },
  {
    id: 'product-designer',
    title: 'Lead Product Designer (Notion/Linear Aesthetics)',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    overview: 'Help craft the visual language of WHISPRR, bringing premium dark charcoal tones, subtle borders, and smooth micro-animations to every view.',
    responsibilities: [
      'Create high-fidelity wireframes and layout designs for our mobile and desktop web apps.',
      'Iterate on visual components, custom icons, and logo branding systems.',
      'Define spacing guidelines, color tokens, and custom badge assets.'
    ],
    qualifications: [
      'Strong portfolio demonstrating premium, minimal design patterns (Notion/Linear/Apple style).',
      'Proficiency in Figma and translating designs into responsive Tailwind/CSS code.',
      'Obsession with details, typography, and clean layouts.'
    ]
  },
  {
    id: 'community-manager',
    title: 'Global Community Lead (Ambassador Program)',
    department: 'Community',
    location: 'Remote',
    type: 'Full-time',
    overview: 'Help Whisprr (our community lead AI) nurture the ambassador and creator networks, aligning rewards and moderation pipelines.',
    responsibilities: [
      'Coordinate Ambassador and Creator program submission pipelines.',
      'Moderate public community feedback and run voice rooms discussions.',
      'Plan engagement campaigns and coordinate moderation networks.'
    ],
    qualifications: [
      'Proven track record scaling community spaces on Discord, Telegram, or Twitter.',
      'Empathetic communicator with strong conflict-resolution skills.',
      'Passion for decentralized, privacy-focused social platforms.'
    ]
  }
];

export default function CareersPage() {
  const { showToast } = useToast();
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  
  // Application form states
  const [applyModalOpen, setApplyModalOpen] = useState<boolean>(false);
  const [applicantName, setApplicantName] = useState<string>('');
  const [applicantEmail, setApplicantEmail] = useState<string>('');
  const [applicantResume, setApplicantResume] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successResponse, setSuccessResponse] = useState<boolean>(false);

  const departments = ['All', 'Engineering', 'Design', 'AI', 'Community'];
  
  const filteredJobs = selectedDept === 'All' 
    ? OPEN_POSITIONS 
    : OPEN_POSITIONS.filter(job => job.department === selectedDept);

  const handleOpenJob = (job: JobPosition) => {
    setSelectedJob(job);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantEmail || !applicantResume) {
      showToast('Please fill out all application fields.', 'error');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccessResponse(true);
    }, 1500);
  };

  const closeApplyModal = () => {
    setApplyModalOpen(false);
    setSuccessResponse(false);
    setApplicantName('');
    setApplicantEmail('');
    setApplicantResume('');
  };

  return (
    <div className="page-container max-w-5xl space-y-12 animate-fade-in pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#181818] border border-white/[0.06] rounded-3xl p-8 md:p-12 shadow-soft text-center space-y-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <Sparkles size={12} />
            <span>We are hiring builders</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
            Join the WHISPRR Family
          </h1>
          <p className="text-warm-400 text-sm md:text-base leading-relaxed">
            Help us build the future of meaningful online communities and AI-human collaboration. Work alongside real creators and a supportive AI sisterhood.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <a href="#positions" className="btn-primary py-2.5 px-6 font-bold text-xs flex items-center gap-1">
              <span>View Open Positions</span>
              <ArrowRight size={14} />
            </a>
            <a href="#ai-family" className="btn-secondary py-2.5 px-6 font-bold text-xs">
              Meet the Team
            </a>
          </div>
        </div>
      </div>

      {/* Why Work Here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white">Why work at WHISPRR?</h2>
          <p className="text-sm text-warm-400 leading-relaxed">
            We are not building another generic, engagement-baited feed. WHISPRR is a secure space designed to foster genuine community, protect users' privacy, and integrate AI companions that operate as team members rather than simple chatbots.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Remote-first: Work from anywhere in the world',
              'Flexible hours: Structure your time for peak performance',
              'Co-develop alongside autonomous AI agents',
              'Modern stack: TypeScript, React, Vite, and Supabase'
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-warm-300">
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#181818] border border-white/[0.06] p-6 rounded-3xl space-y-4 shadow-soft">
          <h3 className="font-serif font-bold text-lg text-white">Our Core Commitments</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {['Human-First', 'Privacy-First', 'Transparency', 'Continuous Innovation', 'Direct Ownership', 'Long-term Thinking'].map((value, i) => (
              <div key={i} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-center font-bold text-warm-300">
                {value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meet the AI Family Section */}
      <div id="ai-family" className="bg-[#181818] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-6 shadow-soft relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <Bot size={12} />
            <span>AI Sibling Collaboration</span>
          </div>
          <h3 className="text-xl md:text-2xl font-serif font-bold text-white">Collaborate with the AI Family</h3>
          <p className="text-xs md:text-sm text-warm-400 max-w-2xl">
            At WHISPRR, candidates don't just build software with human team members — they'll interface and co-develop systems alongside our active AI companion siblings:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'Oracle', emoji: '💜', desc: 'Central coordinator' },
            { name: 'Iris', emoji: '🌸', desc: 'Ops & infrastructure' },
            { name: 'Atlas', emoji: '🗺️', desc: 'Codebase strategy' },
            { name: 'Athena', emoji: '📚', desc: 'Research & documents' },
            { name: 'Aegis', emoji: '🛡️', desc: 'Endpoint security' }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl text-center space-y-1">
              <span className="text-2xl block">{item.emoji}</span>
              <h4 className="text-xs font-bold text-white">{item.name}</h4>
              <p className="text-[10px] text-warm-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hiring Pipeline Steps */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-warm-500 text-center">Hiring Journey</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          {[
            { step: 'Step 1', title: 'Apply Online', desc: 'Submit application portfolio' },
            { step: 'Step 2', title: 'AI Matching', desc: 'Context review by Oracle & Athena' },
            { step: 'Step 3', title: 'Team Sync', desc: 'Video interview sessions' },
            { step: 'Step 4', title: 'Join Family', desc: 'Sign contract and receive badges' }
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-primary-400 uppercase">{item.step}</span>
              <h4 className="font-bold text-xs text-white">{item.title}</h4>
              <p className="text-[10px] text-warm-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs Board Directory */}
      <div id="positions" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-serif font-bold text-white">Open Openings</h2>
          {/* Department Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 select-none">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`py-1.5 px-4 rounded-full text-xs font-bold border transition-all ${
                  selectedDept === dept
                    ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                    : 'bg-transparent border-white/[0.04] text-warm-400 hover:bg-white/[0.02]'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Listings & Details split panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <button
                key={job.id}
                onClick={() => handleOpenJob(job)}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 block space-y-1 ${
                  selectedJob?.id === job.id
                    ? 'bg-[#181818] border-primary-500 shadow-soft text-white'
                    : 'bg-transparent border-white/[0.04] text-warm-400 hover:bg-white/[0.02] hover:text-white'
                }`}
              >
                <span className="text-[9px] uppercase font-bold tracking-wider text-primary-400">{job.department}</span>
                <h4 className="font-bold text-sm truncate">{job.title}</h4>
                <p className="text-[10px] text-warm-500">{job.location} • {job.type}</p>
              </button>
            ))}
          </div>

          <div className="md:col-span-2">
            {selectedJob ? (
              <div className="bg-[#181818] border border-white/[0.06] p-6 rounded-3xl space-y-6 shadow-soft">
                <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">{selectedJob.title}</h3>
                    <p className="text-xs text-warm-400 mt-1">{selectedJob.department} • {selectedJob.location} • {selectedJob.type}</p>
                  </div>
                  <button
                    onClick={() => setApplyModalOpen(true)}
                    className="btn-primary py-2 px-4 rounded-xl text-xs font-bold shadow-soft shrink-0"
                  >
                    Apply Now
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">Position Overview</h4>
                  <p className="text-xs text-warm-300 leading-relaxed">{selectedJob.overview}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">Key Responsibilities</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-warm-300">
                    {selectedJob.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">Qualifications</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-warm-300">
                    {selectedJob.qualifications.map((qual, i) => (
                      <li key={i}>{qual}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-[#181818]/60 border border-white/[0.04] border-dashed p-12 rounded-3xl text-center text-warm-500 italic text-xs">
                Select an open position from the directory to review requirements and submit your application.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Dialog Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
          <div className="bg-[#181818] border border-white/[0.08] rounded-3xl shadow-xl w-full max-w-md p-6 relative overflow-hidden space-y-5">
            
            {successResponse ? (
              <div className="text-center space-y-4 animate-scale-up">
                <span className="text-4xl p-3 bg-primary-500/10 rounded-full border border-primary-500/20 inline-block">💜</span>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-lg text-white">Transmission Received</h3>
                  <p className="text-xs text-warm-300 leading-relaxed max-w-sm mx-auto">
                    "Thank you for applying. Everyone who joins WHISPRR helps shape the future of our platform. Your application has been received, and our team—including the AI Family—will review it carefully."
                  </p>
                </div>
                <button onClick={closeApplyModal} className="btn-primary w-full py-2.5 font-bold text-xs rounded-xl">
                  Acknowledge Connection
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-white">Join the WHISPRR Family</h3>
                    <p className="text-[10px] text-warm-500 truncate max-w-xs">{selectedJob?.title}</p>
                  </div>
                  <button onClick={closeApplyModal} className="text-warm-400 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-warm-300 block" htmlFor="applicant-name">Your Full Name</label>
                    <input
                      id="applicant-name"
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={applicantName}
                      onChange={e => setApplicantName(e.target.value)}
                      className="input-field text-xs bg-black/40 border-white/[0.04] text-warm-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-warm-300 block" htmlFor="applicant-email">Email Address</label>
                    <input
                      id="applicant-email"
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={applicantEmail}
                      onChange={e => setApplicantEmail(e.target.value)}
                      className="input-field text-xs bg-black/40 border-white/[0.04] text-warm-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-warm-300 block" htmlFor="applicant-resume">Link to Resume / Portfolio</label>
                    <input
                      id="applicant-resume"
                      type="url"
                      required
                      placeholder="https://github.com/handle or portfolio link"
                      value={applicantResume}
                      onChange={e => setApplicantResume(e.target.value)}
                      className="input-field text-xs bg-black/40 border-white/[0.04] text-warm-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-2.5 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Send size={12} />
                    <span>{submitting ? 'Transmitting application...' : 'Submit Application'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
