import React from 'react';
import { Gamepad2, Target, Briefcase, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { RpgGameState, RpgChoice } from '../../types';

interface RpgGameOverlayProps {
  gameState: RpgGameState;
  onSelectChoice: (choice: RpgChoice) => void;
}

export const RpgGameOverlay: React.FC<RpgGameOverlayProps> = ({
  gameState,
  onSelectChoice,
}) => {
  return (
    <div className="bg-gradient-to-r from-warm-900 via-purple-950 to-warm-950 text-white p-4 rounded-3xl border border-purple-500/30 shadow-xl space-y-4 my-3">
      
      {/* Objective Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Target size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
              Active Quest Objective
            </span>
            <h4 className="font-serif font-bold text-sm text-white line-clamp-1">
              {gameState.current_objective || 'Explore the unknown realm and talk to locals.'}
            </h4>
          </div>
        </div>

        {/* Quest Progress Bar */}
        <div className="w-full sm:w-40 space-y-1">
          <div className="flex justify-between text-[10px] text-warm-300 font-semibold">
            <span>Progress</span>
            <span>{gameState.progress_percent}%</span>
          </div>
          <div className="w-full h-2 bg-warm-900 rounded-full overflow-hidden border border-purple-500/20">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500"
              style={{ width: `${gameState.progress_percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats & Inventory Pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(gameState.stats || {}).map(([stat, val]) => (
          <span
            key={stat}
            className="px-2.5 py-1 rounded-xl bg-warm-900/80 border border-purple-500/30 text-purple-200 font-medium flex items-center gap-1.5"
          >
            <Zap size={12} className="text-amber-400" />
            <span className="capitalize">{stat}:</span>
            <span className="font-bold text-white">{val}</span>
          </span>
        ))}

        {gameState.inventory?.length > 0 && (
          <span className="px-2.5 py-1 rounded-xl bg-warm-900/80 border border-purple-500/30 text-purple-200 font-medium flex items-center gap-1.5">
            <Briefcase size={12} className="text-purple-400" />
            <span>Items:</span>
            <span className="font-bold text-white">{gameState.inventory.join(', ')}</span>
          </span>
        )}
      </div>

      {/* Dynamic Choice Buttons (A, B, C) */}
      {gameState.available_choices?.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-warm-300 uppercase tracking-wider block">
            Make Your Move:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {gameState.available_choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onSelectChoice(choice)}
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-purple-600/30 border border-purple-500/30 text-left text-xs font-semibold text-white transition-all flex items-start gap-2.5 hover:border-purple-400 active:scale-[0.98]"
              >
                <span className="w-5 h-5 rounded-lg bg-purple-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow">
                  {choice.key}
                </span>
                <span className="leading-snug line-clamp-2">{choice.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
