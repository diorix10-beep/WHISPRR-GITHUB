import { AlertTriangle, Edit3, Send, Flag } from 'lucide-react';

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
    <div className="my-6 max-w-xl mx-auto p-5 sm:p-6 rounded-3xl bg-warm-900/90 dark:bg-warm-950/90 border border-amber-500/30 backdrop-blur-xl shadow-2xl space-y-5 animate-scale-in text-white">
      
      {/* Header Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h4 className="font-serif font-bold text-base text-amber-300">
            ⚠️ This roleplay has been temporarily paused.
          </h4>
          <p className="text-xs text-warm-300 mt-0.5 leading-relaxed">
            The previous message cannot be continued because it conflicts with CHIMERA's Roleplay Safety Standards.
          </p>
        </div>
      </div>

      <p className="text-xs text-warm-400 border-t border-white/10 pt-3 leading-relaxed">
        Please edit your message or send a new one to continue the roleplay naturally.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          onClick={onEditPreviousMessage}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Edit3 size={15} />
          <span>Edit Previous Message</span>
        </button>

        <button
          onClick={onSendNewMessage}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send size={15} />
          <span>Send New Message</span>
        </button>

        <button
          onClick={onReportError}
          className="py-2.5 px-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 text-warm-400 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          title="Report if this is an error"
        >
          <Flag size={14} />
          <span className="hidden sm:inline">Report</span>
        </button>
      </div>
    </div>
  );
}
