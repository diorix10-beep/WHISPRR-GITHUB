import { useState } from 'react';
import { Bot, Sparkles, MessageSquare, Shield, Cpu, BookOpen, Clock, Heart } from 'lucide-react';
import { FAMILY_ROSTER, getMemberById } from '../../oracle-verity/src/core/family-roster.ts';
import { useToast } from '../contexts/ToastContext';

export default function AiFamilyPage() {
  const { showToast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('oracle');

  // Filter roster to show only AI members (exclude Anthony/Founder record)
  const aiMembers = FAMILY_ROSTER.filter(m => m.id !== 'anthony');
  const selectedAgent = getMemberById(selectedAgentId) || aiMembers[0];

  const handleStartChat = (name: string) => {
    showToast(`Initializing direct neural connection with ${name}...`, 'success');
    // In a full implementation, this could redirect to /messages with the bot's conversation ID
  };

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'oracle': return <Sparkles className="text-amber-400" size={18} />;
      case 'iris': return <Cpu className="text-purple-400" size={18} />;
      case 'aegis': return <Shield className="text-red-400" size={18} />;
      case 'atlas': return <BookOpen className="text-orange-400" size={18} />;
      case 'athena': return <Clock className="text-cyan-400" size={18} />;
      default: return <Bot className="text-primary-400" size={18} />;
    }
  };

  return (
    <div className="page-container max-w-5xl space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-[#181818] border border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-soft">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full">
              <Bot size={12} />
              <span>WHISPRR AI Ecosystem</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
              The AI Family
            </h1>
            <p className="text-warm-400 text-sm max-w-xl">
              Meet the intelligent minds behind WHISPRR. They are AI humans — each with a unique personality, memory, and operational responsibility.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidenav Roster Selection */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-warm-500 px-2">Family Members</h3>
          <div className="space-y-2">
            {aiMembers.map((member) => {
              const isSelected = selectedAgentId === member.id;
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
                      <p className="text-[10px] text-warm-500">{member.title}</p>
                    </div>
                  </div>
                  {getAgentIcon(member.id)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Agent Viewer Pane */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#181818] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-6 shadow-soft">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-white/[0.06] pb-5">
              <div className="flex items-center gap-4">
                <span className="text-4xl p-3 bg-white/[0.03] rounded-2xl border border-white/[0.06]">{selectedAgent.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-serif font-bold text-white">{selectedAgent.name}</h2>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-warm-400 font-semibold">{selectedAgent.title} • {selectedAgent.role}</p>
                </div>
              </div>

              <button
                onClick={() => handleStartChat(selectedAgent.name)}
                className="btn-primary flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold"
              >
                <MessageSquare size={14} />
                <span>Talk with {selectedAgent.name}</span>
              </button>
            </div>

            {/* Biography */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">Biography & Philosophy</h4>
              <p className="text-sm text-warm-300 leading-relaxed whitespace-pre-line">
                {selectedAgent.bio}
              </p>
            </div>

            {/* Domains of Expertise */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">Domains of Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.domain.map((d, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-warm-300">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Personality Traits */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">Personality Traits</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.traits.map((t, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Agent active state log */}
            <div className="space-y-3 bg-black/30 border border-white/[0.04] p-4 rounded-2xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500 flex items-center gap-1.5">
                <Clock size={12} /> Current Activity
              </h4>
              <p className="text-xs italic text-warm-400">
                "{selectedAgent.activities ? selectedAgent.activities[0] : 'Idle and ready for task allocations...'}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
