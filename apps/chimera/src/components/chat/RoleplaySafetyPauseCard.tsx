import { Edit3, Send, Flag, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';
import { GuardianSigil } from '../common/GuardianSigil';

interface RoleplaySafetyPauseCardProps {
  onEditPreviousMessage: () => void;
  onSendNewMessage: () => void;
  onReportError: () => void;
}

export function RoleplaySafetyPauseCard({
  onEditPreviousMessage,
  onSendNewMessage,
  onReportError,
}: RoleplaySafetyPauseCardProps) {
  return (
    <div className="my-8 max-w-lg mx-auto p-6 sm:p-8 rounded-[32px] bg-gradient-to-b from-[#18092b]/95 via-[#0f051d]/98 to-[#090214]/98 border border-purple-500/40 backdrop-blur-2xl shadow-[0_0_60px_rgba(168,85,247,0.25)] relative overflow-hidden text-white font-sans animate-scale-in">
      
      {/* Background Magical Refraction Glows & Floating Particles */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Top Border Glow Line */}
      <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_12px_#c084fc]" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        
        {/* Glowing Guardian Sigil Focal Point */}
        <div className="pt-2">
          <GuardianSigil size={96} />
        </div>

        {/* Title Header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-purple-300">
            <Sparkles size={12} className="text-purple-400" />
            <span>C H I M E R A</span>
            <Sparkles size={12} className="text-purple-400" />
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-white drop-shadow-md">
            SCENE <span className="text-purple-400">INTERRUPTED</span>
          </h3>
        </div>

        {/* Reason & Guidance Message */}
        <div className="space-y-2 max-w-md text-xs sm:text-sm text-purple-200/90 leading-relaxed font-serif">
          <p>
            This message cannot be continued because it conflicts with <strong className="text-purple-300 font-sans">CHIMERA's Roleplay Safety Standards</strong>.
          </p>
          <p className="text-xs text-purple-300/70 font-sans">
            Edit your message or send a new one to continue the roleplay.
          </p>
        </div>

        {/* Action Buttons Matrix */}
        <div className="w-full space-y-3 pt-2">
          
          {/* Action 1: Edit Previous Message */}
          <button
            onClick={onEditPreviousMessage}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-900/60 to-purple-800/40 hover:from-purple-800/80 hover:to-purple-700/60 border border-purple-500/50 hover:border-purple-400 text-white font-bold text-xs shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 group-hover:text-white transition-colors">
                <Edit3 size={18} />
              </div>
              <div className="text-left">
                <div className="font-extrabold uppercase tracking-wider text-purple-200 text-xs">
                  EDIT PREVIOUS MESSAGE
                </div>
                <div className="text-[10px] text-purple-300/70 font-normal">
                  Modify your last message and try again.
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Action 2: Send New Message */}
          <button
            onClick={onSendNewMessage}
            className="w-full p-4 rounded-2xl bg-black/40 hover:bg-purple-950/40 border border-purple-500/30 hover:border-purple-400/60 text-white font-bold text-xs transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 group-hover:text-white transition-colors">
                <Send size={18} />
              </div>
              <div className="text-left">
                <div className="font-extrabold uppercase tracking-wider text-purple-200 text-xs">
                  SEND NEW MESSAGE
                </div>
                <div className="text-[10px] text-purple-300/70 font-normal">
                  Start a new message to continue.
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Action 3: Report This */}
          <button
            onClick={onReportError}
            className="w-full p-4 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/20 text-purple-300/80 hover:text-purple-200 font-bold text-xs transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:text-purple-200 transition-colors">
                <ShieldAlert size={18} />
              </div>
              <div className="text-left">
                <div className="font-extrabold uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <span>REPORT THIS</span>
                  <span className="text-[9px] text-purple-400/80 font-normal lowercase">(if this is an error)</span>
                </div>
                <div className="text-[10px] text-purple-300/60 font-normal">
                  Let us know if you believe this was a mistake.
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-purple-400/60 group-hover:translate-x-0.5 transition-transform" />
          </button>

        </div>

        {/* Guardian Footer Emblem & Statement */}
        <div className="pt-3 border-t border-purple-500/20 text-[11px] text-purple-300/70 space-y-1 max-w-xs">
          <div className="flex items-center justify-center gap-1.5 text-purple-300 font-semibold text-[11px]">
            <Sparkles size={12} className="text-purple-400" />
            <span>The Guardian Sigil protects our world</span>
          </div>
          <p className="text-[10px] text-purple-400/60 leading-normal">
            Thank you for helping us keep CHIMERA a respectful space.
          </p>
        </div>

      </div>
    </div>
  );
}
