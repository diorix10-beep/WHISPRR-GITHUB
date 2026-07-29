import { Edit3, Send, Flag, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';

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
    <div className="my-8 max-w-md sm:max-w-lg mx-auto p-6 sm:p-8 rounded-[36px] bg-gradient-to-b from-[#18082a]/95 via-[#0d031a]/98 to-[#07010f]/98 border border-purple-500/40 backdrop-blur-2xl shadow-[0_0_60px_rgba(168,85,247,0.3)] relative overflow-hidden text-white font-sans animate-scale-in">
      
      {/* Ambient Cosmic Background Lighting */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Luminous Border Accent */}
      <div className="absolute top-0 inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-purple-300 to-transparent shadow-[0_0_15px_#c084fc]" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        
        {/* Guardian Sigil Emblem Artwork Focal Point */}
        <div className="relative group cursor-pointer pt-2">
          <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-2xl group-hover:blur-3xl transition-all animate-pulse" />
          <img
            src="/guardian-sigil.png"
            alt="CHIMERA Guardian Sigil"
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-3xl relative z-10 drop-shadow-[0_0_25px_rgba(168,85,247,0.8)] transform group-hover:scale-105 transition-transform duration-300 border border-purple-500/30 p-1 bg-black/40"
          />
        </div>

        {/* Title Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-purple-300/90">
            <Sparkles size={12} className="text-purple-400" />
            <span>C H I M E R A</span>
            <Sparkles size={12} className="text-purple-400" />
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-white drop-shadow-md">
            SCENE <span className="text-purple-400">INTERRUPTED</span>
          </h3>
        </div>

        {/* Reason & Guidance Text */}
        <div className="space-y-2 max-w-sm text-xs sm:text-sm text-purple-200/90 leading-relaxed">
          <p className="font-medium">
            This message cannot be continued because it conflicts with <strong className="text-purple-300 font-bold">CHIMERA's Roleplay Safety Standards</strong>.
          </p>
          <p className="text-xs text-purple-300/70">
            Edit your message or send a new one to continue the roleplay.
          </p>
        </div>

        {/* 3 Interactive Action Buttons */}
        <div className="w-full space-y-3 pt-2">
          
          {/* Button 1: EDIT PREVIOUS MESSAGE */}
          <button
            onClick={onEditPreviousMessage}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-900/70 via-purple-800/50 to-purple-900/70 hover:from-purple-800/90 hover:to-purple-700/70 border border-purple-400/60 hover:border-purple-300 text-white font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-purple-200 group-hover:text-white transition-colors">
                <Edit3 size={18} />
              </div>
              <div className="text-left">
                <div className="font-extrabold uppercase tracking-wider text-purple-100 text-xs">
                  EDIT PREVIOUS MESSAGE
                </div>
                <div className="text-[10px] text-purple-300/80 font-normal">
                  Modify your last message and try again.
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-purple-300 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 2: SEND NEW MESSAGE */}
          <button
            onClick={onSendNewMessage}
            className="w-full p-4 rounded-2xl bg-black/50 hover:bg-purple-950/50 border border-purple-500/35 hover:border-purple-400/70 text-white font-bold text-xs transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:text-white transition-colors">
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
            <ChevronRight size={18} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 3: REPORT THIS (IF THIS IS AN ERROR) */}
          <button
            onClick={onReportError}
            className="w-full p-4 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/25 text-purple-300/80 hover:text-purple-200 font-bold text-xs transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
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
            <ChevronRight size={18} className="text-purple-400/60 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

        {/* Footer Guardian Statement */}
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
