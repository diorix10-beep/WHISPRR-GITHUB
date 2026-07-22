import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, MessageSquare, User, Share2 } from 'lucide-react';
import { ShareToWhisprrModal } from './ShareToWhisprrModal';

interface CharacterCardProps {
  character: any;
  onClick?: () => void;
  actionMenu?: React.ReactNode;
}

export function CharacterCard({ character, onClick, actionMenu }: CharacterCardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const profile = character.bot_profile || {};
  const creator = character.creator || {};
  
  const photoUrl = profile.photo_url;
  const avatarEmoji = profile.avatar_emoji || '🎭';
  const name = profile.display_name || 'Unnamed';
  const creatorName = creator.username || 'unknown';
  const description = character.short_description || 'No description provided.';
  const category = character.category || 'General';
  const chatsCount = character.chats_count || 0;
  const viewsCount = character.views_count || 0;
  const isNSFW = character.rating === 'nsfw';

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl bg-warm-900 border border-warm-200 dark:border-warm-800 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10 hover:border-red-400 dark:hover:border-red-600 aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4]"
    >
      {/* Background Image / Gradient overlay */}
      <div className="absolute inset-0 bg-warm-100 dark:bg-warm-800">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-warm-100 dark:from-red-900/30 dark:to-warm-800 text-6xl transition-transform duration-500 group-hover:scale-105">
            {avatarEmoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
      </div>

      {/* Top Badges & Actions */}
      <div className="relative p-3 flex justify-between items-start">
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-warm-200 uppercase tracking-wider border border-white/10">
            {category}
          </span>
          {character.visibility === 'private' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-amber-400/50">
              Draft 📝
            </span>
          )}
          {isNSFW && (
            <span className="px-2 py-0.5 rounded-full bg-red-600/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-red-500/50">
              NSFW
            </span>
          )}
        </div>
        {actionMenu && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            {actionMenu}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Bottom Content Info */}
      <div className="relative p-4 space-y-1.5">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-tight truncate">
          {name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-warm-300">
          <User size={12} className="opacity-70" />
          <span className="truncate hover:text-white transition-colors">@{creatorName}</span>
        </div>
        <p className="text-xs text-warm-400 line-clamp-2 leading-snug mt-2">
          {description}
        </p>
        
        {/* Stats & Share */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-warm-300">
              <MessageSquare size={12} />
              {chatsCount.toLocaleString()}
            </div>
            {viewsCount > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-warm-300">
                <Eye size={12} />
                {viewsCount.toLocaleString()}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShareModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Share to WHISPRR"
          >
            <Share2 size={13} />
          </button>
        </div>

        <ShareToWhisprrModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          character={{
            id: character.id,
            name,
            description,
            avatarUrl: photoUrl,
            category
          }}
        />
      </div>
    </div>
  );
}
