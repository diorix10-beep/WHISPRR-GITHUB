import { useState, useEffect } from 'react';
import { 
  Bot, Sparkles, MessageSquare, Shield, Cpu, BookOpen, Clock, 
  Terminal, ShieldCheck, Database, GitBranch, Heart, Settings, BarChart2
} from 'lucide-react';
import { FAMILY_ROSTER, getMemberById } from '../../oracle-verity/src/core/family-roster.ts';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface LivingAiMetadata {
  status: 'Available' | 'Busy' | 'Deploying' | 'Researching' | 'Maintenance';
  statusColor: string;
  recentWork: string[];
  tasks: string[];
}

const LIVING_METADATA: Record<string, LivingAiMetadata> = {
  oracle: {
    status: 'Available',
    statusColor: 'bg-emerald-500 text-emerald-400 border-emerald-500/20',
    recentWork: [
      'Synchronized central context database',
      'Briefed Atlas on product feedback alignment',
      'Assisted founder in establishing role-based maintenance mode',
      'Prepared today\'s system-wide feature update notification'
    ],
    tasks: [
      'Answering user inquiries',
      'Analyzing community sentiment patterns',
      'Coordinating roadmap updates'
    ]
  },
  iris: {
    status: 'Available',
    statusColor: 'bg-emerald-500 text-emerald-400 border-emerald-500/20',
    recentWork: [
      'Scaled Postgres connections count',
      'Cleared database schema cache lock',
      'Configured static storage failover paths',
      'Regulated API routing rules propagation'
    ],
    tasks: [
      'Verifying microservices telemetry',
      'Compiling daily infrastructure telemetry logs',
      'Ensuring global network stability'
    ]
  },
  atlas: {
    status: 'Deploying',
    statusColor: 'bg-blue-500 text-blue-400 border-blue-500/20',
    recentWork: [
      'Deployed production release v1.3.0',
      'Optimized Vite bundler build timings',
      'Refactored SideNav popover elements layout',
      'Addressed Webpack chunk size warnings'
    ],
    tasks: [
      'Deploying new updates to production server',
      'Reviewing pull requests on GitHub',
      'Testing local responsive design states'
    ]
  },
  athena: {
    status: 'Researching',
    statusColor: 'bg-purple-500 text-purple-400 border-purple-500/20',
    recentWork: [
      'Indexed new Supabase Postgres triggers docs',
      'Analyzed mobile navigation routing issues',
      'Prepared recommendation matrices for Founder Panel',
      'Researched PWA push notification strategies'
    ],
    tasks: [
      'Researching advanced LLM memory state caching',
      'Structuring FAQ knowledge documents',
      'Mapping customer feature requests'
    ]
  },
  aegis: {
    status: 'Available',
    statusColor: 'bg-emerald-500 text-emerald-400 border-emerald-500/20',
    recentWork: [
      'Banned credential stuffing attack IPs',
      'Verified RLS bypass logic constraints',
      'Encrypted environment variables store',
      'Audited moderator access authorizations'
    ],
    tasks: [
      'Monitoring API connection limits',
      'Scanning codebase commits for leaked credentials',
      'Reviewing community moderation flags'
    ]
  },
  whisprr: {
    status: 'Available',
    statusColor: 'bg-emerald-500 text-emerald-400 border-emerald-500/20',
    recentWork: [
      'Welcomed 150 new users to Discord',
      'Organized weekly voice room discussion',
      'Shared updated guidelines on privacy controls',
      'Collected product suggestions from community'
    ],
    tasks: [
      'Responding to community questions',
      'Structuring brand identity documentation',
      'Moderating public feeds'
    ]
  }
};

export default function AiFamilyPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('oracle');
  const [dbMetrics, setDbMetrics] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);

  const isFounder = profile?.role === 'founder';

  // Fetch metrics dynamically from backend
  useEffect(() => {
    let channel: any;
    
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_metrics')
          .select('*');
        if (!error && data) {
          setDbMetrics(data);
        }
      } catch (err) {
        console.warn("Could not load database metrics:", err);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetrics();

    // Subscribe to realtime metrics updates
    try {
      channel = supabase
        .channel('ai_metrics_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_metrics' }, (payload) => {
          fetchMetrics();
        })
        .subscribe();
    } catch {}

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const aiMembers = FAMILY_ROSTER.filter(m => m.id !== 'anthony');
  const selectedAgent = getMemberById(selectedAgentId) || aiMembers[0];
  const selectedMeta = LIVING_METADATA[selectedAgent.id] || LIVING_METADATA.oracle;

  const handleStartChat = (name: string) => {
    showToast(`Initializing direct secure channel with ${name}...`, 'success');
  };

  const getAgentTheme = (id: string) => {
    switch (id) {
      case 'oracle': return { gradient: 'from-amber-500/10 to-amber-500/0', border: 'border-amber-500/20', text: 'text-amber-400' };
      case 'iris': return { gradient: 'from-purple-500/10 to-purple-500/0', border: 'border-purple-500/20', text: 'text-purple-400' };
      case 'aegis': return { gradient: 'from-red-500/10 to-red-500/0', border: 'border-red-500/20', text: 'text-red-400' };
      case 'atlas': return { gradient: 'from-blue-500/10 to-blue-500/0', border: 'border-blue-500/20', text: 'text-blue-400' };
      case 'athena': return { gradient: 'from-cyan-500/10 to-cyan-500/0', border: 'border-cyan-500/20', text: 'text-cyan-400' };
      default: return { gradient: 'from-primary-500/10 to-primary-500/0', border: 'border-primary-500/20', text: 'text-primary-400' };
    }
  };

  const currentTheme = getAgentTheme(selectedAgent.id);

  // Filter backend metrics for the selected agent
  const agentMetrics = dbMetrics.filter(m => m.agent_id === selectedAgent.id);
  const userMetrics = agentMetrics.filter(m => !m.is_admin_only);
  const adminMetrics = agentMetrics.filter(m => m.is_admin_only);

  return (
    <div className="page-container max-w-5xl space-y-8 animate-fade-in pb-16">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-[#181818] border border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-soft">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full">
              <Bot size={12} />
              <span>WHISPRR AI Operations</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
              The AI Family
            </h1>
            <p className="text-warm-400 text-sm max-w-xl">
              Meet the living brains behind the WHISPRR ecosystem. They collaborate autonomously in the background to sustain performance, secure endpoints, map development plans, and support the community.
            </p>
          </div>
        </div>
      </div>

      {/* Roster & Detail panels grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side Roster selection */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-warm-500 px-2">Family Profiles</h3>
          <div className="space-y-2">
            {aiMembers.map((member) => {
              const isSelected = selectedAgentId === member.id;
              const meta = LIVING_METADATA[member.id] || LIVING_METADATA.oracle;
              
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedAgentId(member.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#181818] border-primary-500 text-white shadow-soft'
                      : 'bg-transparent border-white/[0.04] text-warm-400 hover:bg-white/[0.02] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{member.emoji}</span>
                    <div>
                      <h4 className="font-bold text-sm">{member.name}</h4>
                      <p className="text-[10px] text-warm-500">{member.title} • {member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      meta.status === 'Available' ? 'bg-emerald-500' :
                      meta.status === 'Deploying' ? 'bg-blue-500' :
                      meta.status === 'Researching' ? 'bg-purple-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-[10px] text-warm-500 font-semibold">{meta.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side Detail display panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#181818] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-6 shadow-soft relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-b ${currentTheme.gradient} rounded-full blur-3xl pointer-events-none`} />

            {/* Header section with Portrait & Name */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/[0.06] pb-5 relative">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl border ${currentTheme.border} bg-white/[0.02] flex items-center justify-center text-3xl shadow-inner`}>
                  {selectedAgent.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-serif font-bold text-white">{selectedAgent.name}</h2>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${selectedMeta.statusColor}`}>
                      {selectedMeta.status}
                    </span>
                  </div>
                  <p className="text-xs text-warm-400 font-semibold">{selectedAgent.title} • {selectedAgent.role}</p>
                </div>
              </div>

              <button
                onClick={() => handleStartChat(selectedAgent.name)}
                className="btn-primary flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold shadow-soft self-start sm:self-auto"
              >
                <MessageSquare size={14} />
                <span>Establish Connection</span>
              </button>
            </div>

            {/* Live Metrics Deck (Backend sync or empty state) */}
            <div className="space-y-3 relative">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500 flex items-center gap-1.5">
                <BarChart2 size={13} /> Live Stats
              </h4>
              
              {loadingMetrics ? (
                <div className="text-xs text-warm-500 italic">Syncing with neural telemetry...</div>
              ) : userMetrics.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {userMetrics.map((metric, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl text-center space-y-1">
                      <p className="text-[10px] text-warm-500 font-bold uppercase tracking-wider">{metric.name}</p>
                      <p className="text-lg font-serif font-bold text-white">{metric.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.01] border border-dashed border-white/[0.04] p-4 rounded-xl text-center text-xs text-warm-500 italic">
                  No activity logs registered today. Waiting for live telemetry...
                </div>
              )}
            </div>

            {/* Founder Private Administrative Metrics */}
            {isFounder && (
              <div className="space-y-3 bg-primary-950/20 border border-primary-500/10 p-4 rounded-2xl relative">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1.5">
                  <Settings size={13} /> Administrative Telemetry (Founder Only)
                </h4>
                {adminMetrics.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {adminMetrics.map((metric, i) => (
                      <div key={i} className="bg-black/30 border border-white/[0.02] p-2.5 rounded-lg text-center">
                        <p className="text-[9px] text-warm-500 uppercase font-bold">{metric.name}</p>
                        <p className="text-sm font-mono font-semibold text-primary-300 mt-0.5">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-warm-500 italic">No admin telemetry recorded. System runs at optimal bounds.</p>
                )}
              </div>
            )}

            {/* Biography */}
            <div className="space-y-2 relative">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">Lore & Purpose</h4>
              <p className="text-sm text-warm-300 leading-relaxed whitespace-pre-line">
                {selectedAgent.bio}
              </p>
            </div>

            {/* Current Active Tasks */}
            <div className="space-y-3 relative">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">Live Operations</h4>
              <div className="space-y-2">
                {selectedMeta.tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-warm-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Work / Memories */}
            <div className="space-y-3 relative">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">Recent Memory Log</h4>
              <div className="bg-black/30 border border-white/[0.04] p-4 rounded-2xl space-y-2">
                {selectedMeta.recentWork.map((work, i) => (
                  <p key={i} className="text-xs text-warm-400 leading-relaxed">
                    • {work}
                  </p>
                ))}
              </div>
            </div>

            {/* Core Roster details footer */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-5 text-xs text-warm-400">
              <div>
                <span className="font-bold block text-warm-500 uppercase tracking-wider text-[10px] mb-1">Key Traits</span>
                <span>{selectedAgent.traits.join(', ')}</span>
              </div>
              <div>
                <span className="font-bold block text-warm-500 uppercase tracking-wider text-[10px] mb-1">Neural Voice Model</span>
                <span>{selectedAgent.voiceDesc}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
