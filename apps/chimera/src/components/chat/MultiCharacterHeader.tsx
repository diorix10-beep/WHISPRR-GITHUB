import React from 'react';
import { Plus, UserMinus, RefreshCw, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { MultiCharacterParticipant } from '../../types';
import { Avatar } from '../common/Avatar';

interface MultiCharacterHeaderProps {
  participants: MultiCharacterParticipant[];
  activeSpeakerId: string | null;
  onSelectActiveSpeaker: (characterId: string) => void;
  onAddCharacter: () => void;
  onRemoveCharacter: (characterId: string) => void;
}

export const MultiCharacterHeader: React.FC<MultiCharacterHeaderProps> = ({
  participants,
  activeSpeakerId,
  onSelectActiveSpeaker,
  onAddCharacter,
  onRemoveCharacter,
}) => {
  return (
    <div className="bg-warm-100/90 dark:bg-warm-850/90 backdrop-blur-md px-4 py-2 border-b border-warm-200/80 dark:border-warm-800 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
      
      {/* Label */}
      <div className="flex items-center gap-2 shrink-0">
        <Users size={16} className="text-purple-500" />
        <span className="text-xs font-bold text-warm-700 dark:text-warm-300 uppercase tracking-wider hidden sm:inline">
          Scene Characters ({participants.length})
        </span>
      </div>

      {/* Participant Avatars & Active Speaker Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {participants.map((p) => {
          const isActive = p.character_id === activeSpeakerId || p.is_active_speaker;

          return (
            <div
              key={p.character_id}
              onClick={() => onSelectActiveSpeaker(p.character_id)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-2xl cursor-pointer transition-all border shrink-0 ${
                isActive
                  ? 'bg-purple-600/15 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'bg-white/80 dark:bg-warm-900/80 border-warm-200 dark:border-warm-800 text-warm-700 dark:text-warm-300 hover:border-warm-300 dark:hover:border-warm-700'
              }`}
            >
              <div className="relative">
                <Avatar photoUrl={p.photo_url} emoji={p.avatar_emoji} size="sm" />
                {isActive && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] shadow">
                    <RefreshCw size={8} className="animate-spin" />
                  </span>
                )}
              </div>

              <div className="flex flex-col text-left max-w-[100px] truncate">
                <span className="text-xs font-bold truncate leading-tight">{p.display_name}</span>
                <span className="text-[10px] opacity-70 truncate">
                  {isActive ? 'Next Speaker' : 'In Scene'}
                </span>
              </div>

              {/* Remove character button if > 1 character */}
              {participants.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCharacter(p.character_id);
                  }}
                  className="p-1 rounded-lg text-warm-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors ml-1"
                  title={`Remove ${p.display_name} from chat scene`}
                >
                  <UserMinus size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Character CTA */}
      <button
        onClick={onAddCharacter}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition-all shrink-0"
        title="Add another AI character into this story scene"
      >
        <Plus size={14} />
        <span className="hidden sm:inline">Add Character</span>
      </button>

    </div>
  );
};
