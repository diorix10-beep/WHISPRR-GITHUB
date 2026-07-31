import { X, MessageSquare, Edit3, Sparkles, BookOpen, ShieldCheck, Heart, User, Layers, Tag } from 'lucide-react';

interface CharacterDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: any;
  onStartChat: () => void;
  onEdit?: () => void;
}

export function CharacterDetailsModal({
  isOpen,
  onClose,
  character,
  onStartChat,
  onEdit,
}: CharacterDetailsModalProps) {
  if (!isOpen || !character) return null;

  const profile = character.bot_profile || {};
  const creator = character.creator || {};

  const name = character.name || profile.display_name || character.display_name || 'AI Character';
  const photoUrl = profile.photo_url || character.photo_url || character.avatar_url;
  const avatarEmoji = profile.avatar_emoji || '🎭';
  const creatorName = creator.username || character.creator_username || profile.username || 'creator';
  const shortDescription = character.short_description || character.bio || 'No short description provided.';
  const longDescription = character.long_description || character.rp_definition || 'No detailed biography provided.';
  const personality = character.personality || 'Standard AI Roleplay Persona.';
  const scenario = character.scenario || 'Default Roleplay Scenario.';
  const greeting = character.greeting || '*Steps forward into the room...* Hello!';
  const exampleDialogues = character.example_dialogues || character.example_conversations || '';
  const category = character.category || 'General';
  const contentRating = character.content_rating || 'SFW';
  const creatorNotes = character.creator_notes || '';
  const tags: string[] = character.tags || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl rounded-3xl bg-warm-900 border border-warm-750 shadow-2xl overflow-hidden text-warm-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-br from-red-950/60 via-warm-900 to-warm-850 overflow-hidden border-b border-warm-800">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover opacity-40 blur-sm scale-110" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-red-900/30 to-purple-900/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-warm-900 via-warm-900/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-warm-300 hover:text-white backdrop-blur-md transition-all z-10"
          >
            <X size={18} />
          </button>

          {/* Avatar & Header Title */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4 z-10">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-xl bg-warm-800 flex-shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-warm-750">
                  {avatarEmoji}
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                  {category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-warm-800 border border-warm-700 text-warm-300 text-[10px] font-bold uppercase tracking-wider">
                  {contentRating}
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white truncate leading-tight">
                {name}
              </h2>
              <p className="text-xs text-warm-400 flex items-center gap-1.5">
                <User size={12} className="text-red-400" />
                <span>Created by <strong className="text-warm-200">@{creatorName}</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed custom-scrollbar">
          {/* Tagline / Short Description */}
          <div className="p-4 rounded-2xl bg-warm-850/80 border border-warm-750 space-y-1">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Summary</span>
            </h4>
            <p className="text-warm-200 text-sm italic">{shortDescription}</p>
          </div>

          {/* Greeting Message */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={13} className="text-red-400" />
              <span>First Greeting Scene</span>
            </h4>
            <div className="p-4 rounded-2xl bg-warm-950/60 border border-warm-800 text-warm-200 whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
              {greeting}
            </div>
          </div>

          {/* Personality */}
          {personality && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider flex items-center gap-1.5">
                <Heart size={13} className="text-red-400" />
                <span>Personality & Trait Definition</span>
              </h4>
              <div className="p-4 rounded-2xl bg-warm-850/50 border border-warm-800 text-warm-300 whitespace-pre-wrap text-xs sm:text-sm">
                {personality}
              </div>
            </div>
          )}

          {/* Scenario */}
          {scenario && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-red-400" />
                <span>Scenario & World Context</span>
              </h4>
              <div className="p-4 rounded-2xl bg-warm-850/50 border border-warm-800 text-warm-300 whitespace-pre-wrap text-xs sm:text-sm">
                {scenario}
              </div>
            </div>
          )}

          {/* Long Description / Biography */}
          {longDescription && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={13} className="text-red-400" />
                <span>Detailed Biography & Backstory</span>
              </h4>
              <div className="p-4 rounded-2xl bg-warm-850/50 border border-warm-800 text-warm-300 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                {longDescription}
              </div>
            </div>
          )}

          {/* Example Dialogues */}
          {exampleDialogues && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={13} className="text-amber-400" />
                <span>Example Dialogues & Speech Style</span>
              </h4>
              <div className="p-4 rounded-2xl bg-warm-950/60 border border-warm-800 text-warm-300 whitespace-pre-wrap text-xs font-mono">
                {exampleDialogues}
              </div>
            </div>
          )}

          {/* Creator Notes */}
          {creatorNotes && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 size={13} className="text-red-400" />
                <span>Creator Notes</span>
              </h4>
              <div className="p-4 rounded-2xl bg-warm-850/50 border border-warm-800 text-warm-400 italic text-xs">
                {creatorNotes}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.map((t, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warm-800 text-warm-300 text-xs font-medium border border-warm-700">
                  <Tag size={10} />
                  <span>{t}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-warm-950/80 border-t border-warm-800 flex flex-wrap items-center justify-between gap-3">
          {onEdit ? (
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-4 py-2.5 rounded-xl bg-warm-800 hover:bg-warm-750 border border-warm-700 text-warm-200 hover:text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Edit3 size={14} />
              <span>Edit Character</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-warm-400 hover:text-white font-bold text-xs transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onStartChat();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <MessageSquare size={14} />
              <span>Start Roleplay Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
