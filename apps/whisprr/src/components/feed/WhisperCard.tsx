import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Flame, Sparkles, Trash2, Share2, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Whisper, Profile, Reaction } from '../../types';
import { Avatar } from '../common/Avatar';
import { MoodBadge } from '../common/MoodBadge';
import { UserBadges } from '../common/UserBadges';
import { useAuth } from '../../contexts/AuthContext';
import { useInterests } from '../../contexts/InterestContext';
import { supabase } from '../../lib/supabase';

interface WhisperCardProps {
  whisper: Whisper & {
    profiles: Profile;
    reactions: Reaction[];
    comment_count: number;
  };
  onWhisperDeleted?: () => void;
  onReactionChange?: () => void;
  communityOwnerId?: string;
  communityModerators?: string[];
}

export const WhisperCard = memo(function WhisperCard({
  whisper,
  onWhisperDeleted,
  onReactionChange,
  communityOwnerId,
  communityModerators,
}: WhisperCardProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { track } = useInterests();
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactionLoading, setReactionLoading] = useState<string | null>(null);

  const isOwnWhisper = user?.id === whisper.user_id;

  const reactions = whisper.reactions || [];
  
  // Safely handle if profiles comes back as an array from Supabase
  const whisperProfile = Array.isArray(whisper.profiles) 
    ? whisper.profiles[0] 
    : whisper.profiles;

  // Count reactions by type
  const reactionCounts = {
    felt: reactions.filter(r => r.type === 'felt').length,
    warmth: reactions.filter(r => r.type === 'warmth').length,
    spark: reactions.filter(r => r.type === 'spark').length,
  };

  // Check if current user has reacted with each type
  const userReactions = {
    felt: reactions.some(r => r.user_id === user?.id && r.type === 'felt'),
    warmth: reactions.some(r => r.user_id === user?.id && r.type === 'warmth'),
    spark: reactions.some(r => r.user_id === user?.id && r.type === 'spark'),
  };

  const handleReaction = useCallback(async (type: 'felt' | 'warmth' | 'spark') => {
    if (!user || !profile) return;

    setReactionLoading(type);
    try {
      const hasReacted = userReactions[type];

      if (hasReacted) {
        // Delete the reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('whisper_id', whisper.id)
          .eq('user_id', user.id)
          .eq('type', type);
      } else {
        // Insert new reaction
        await supabase.from('reactions').insert({
          whisper_id: whisper.id,
          type,
        });

        // Track interest signal
        track({
          eventType: 'reaction',
          targetType: 'whisper',
          targetId: whisper.id,
          mood: whisper.mood || undefined,
          communityId: whisper.community_id || undefined,
          interests: whisper.mood ? [whisper.mood] : undefined,
        });

        // Create notification for whisper owner
        if (whisper.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: whisper.user_id,
            actor_id: user.id,
            type: 'reaction',
            reference_id: whisper.id,
          });
        }
      }

      onReactionChange?.();
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    } finally {
      setReactionLoading(null);
    }
  }, [user, profile, whisper, onReactionChange, track]);

  const handleDelete = useCallback(async () => {
    if (!isOwnWhisper) return;

    setIsDeleting(true);
    try {
      // Delete reactions first
      await supabase.from('reactions').delete().eq('whisper_id', whisper.id);

      // Delete the whisper
      await supabase.from('whispers').delete().eq('id', whisper.id);

      onWhisperDeleted?.();
    } catch (err) {
      console.error('Failed to delete whisper:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [isOwnWhisper, whisper, onWhisperDeleted]);

  const handleWhisperClick = useCallback(() => {
    navigate(`/whisper/${whisper.id}`);
  }, [navigate, whisper.id]);

  const handleProfileClick = useCallback(() => {
    navigate(`/profile/${whisper.profiles.username}`);
  }, [navigate, whisper.profiles.username]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/whisper/${whisper.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Whisper by @${whisper.profiles.username}`,
          text: whisper.content.substring(0, 50) + '...',
          url,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      // Ideally use a toast here
    }
  }, [whisper]);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const handleBookmark = useCallback(() => {
    // Optimistic UI update, backend to be implemented in a future PR
    setIsBookmarked(prev => !prev);
  }, []);

  const getWhisperBadges = () => {
    const list = [...(whisperProfile?.badges || [])];
    if (communityOwnerId && whisper.user_id === communityOwnerId) {
      list.push('community_creator');
    }
    if (communityModerators && communityModerators.includes(whisper.user_id)) {
      list.push('community_moderator');
    }
    return list;
  };

  const renderRichContent = (content: string) => {
    // 1. Check for Poll Code: [Poll: Question? | Option 1 | Option 2]
    const pollRegex = /\[Poll:\s*([^|]+)\s*\|\s*([^\]]+)\]/i;
    const pollMatch = content.match(pollRegex);
    if (pollMatch) {
      const question = pollMatch[1].trim();
      const options = pollMatch[2].split('|').map(o => o.trim());
      return (
        <div className="mb-4 p-5 bg-warm-50 dark:bg-warm-900/60 rounded-2xl border border-warm-150 dark:border-warm-800">
          <h4 className="text-sm font-bold text-warm-900 dark:text-white mb-3 flex items-center gap-1.5">
            📊 Community Poll: {question}
          </h4>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Voted for: ${opt}`);
                }}
                className="w-full text-left p-3 rounded-xl bg-white dark:bg-warm-800 border border-warm-250/50 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:border-primary-300 transition-all text-sm font-medium"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // 2. Check for Character: [Character: Name | Description | Greeting]
    const charRegex = /\[Character:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]/i;
    const charMatch = content.match(charRegex);
    if (charMatch) {
      const name = charMatch[1].trim();
      const desc = charMatch[2].trim();
      const greeting = charMatch[3].trim();
      return (
        <div className="mb-4 p-5 bg-gradient-to-tr from-primary-500/5 to-secondary-500/5 dark:from-primary-950/10 dark:to-secondary-950/10 rounded-2xl border border-primary-100/50 dark:border-primary-900/30 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-500 flex items-center justify-center text-xl flex-shrink-0">
            🎭
          </div>
          <div>
            <h4 className="text-base font-bold text-warm-900 dark:text-white mb-0.5">{name}</h4>
            <p className="text-xs text-warm-500 mb-2">Character Card Embed</p>
            <p className="text-sm text-warm-700 dark:text-warm-300 font-medium italic mb-2">"{greeting}"</p>
            <p className="text-xs text-warm-600 dark:text-warm-400">{desc}</p>
          </div>
        </div>
      );
    }

    // 3. Check for Story: [Story: Title | Summary | CoverURL]
    const storyRegex = /\[Story:\s*([^|]+)\s*\|\s*([^|]+)\s*(?:\|\s*([^\]]+))?\]/i;
    const storyMatch = content.match(storyRegex);
    if (storyMatch) {
      const title = storyMatch[1].trim();
      const summary = storyMatch[2].trim();
      const coverUrl = storyMatch[3] ? storyMatch[3].trim() : null;
      return (
        <div className="mb-4 p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-100 dark:border-warm-800 shadow-sm">
          {coverUrl && (
            <img src={coverUrl} alt={title} className="w-full h-32 object-cover rounded-xl mb-4" />
          )}
          <h4 className="font-serif text-lg font-bold text-warm-900 dark:text-white mb-2 flex items-center gap-1.5">
            📖 Story Preview: {title}
          </h4>
          <p className="text-sm text-warm-650 dark:text-warm-350 leading-relaxed font-serif">{summary}</p>
        </div>
      );
    }

    // 4. Check for Prompt Card
    if (content.includes('```')) {
      const codeRegex = /```(?:prompt)?([\s\S]*?)```/;
      const match = content.match(codeRegex);
      if (match) {
        const promptText = match[1].trim();
        return (
          <div className="mb-4 p-5 bg-warm-950 dark:bg-black rounded-2xl border border-warm-850 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(promptText);
                  alert('Prompt copied!');
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded border border-white/10"
              >
                Copy
              </button>
            </div>
            <div className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-2">⚡ System Prompt</div>
            <pre className="text-sm font-mono text-warm-200 whitespace-pre-wrap leading-relaxed">{promptText}</pre>
          </div>
        );
      }
    }

    return (
      <p className="font-serif text-base leading-relaxed text-warm-800 dark:text-warm-100 whitespace-pre-wrap break-words">
        {content}
      </p>
    );
  };

  return (
    <div className="card mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-start gap-3 flex-1 cursor-pointer"
          onClick={handleProfileClick}
        >
          <Avatar
            emoji={whisperProfile?.avatar_emoji || '👤'}
            photoUrl={whisperProfile?.photo_url}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-warm-900 dark:text-warm-50 truncate">
                {whisperProfile?.display_name || 'Unknown User'}
              </span>
              <UserBadges 
                badges={getWhisperBadges()} 
                role={whisperProfile?.role}
                size="sm" 
              />
              <span className="text-sm text-warm-500 dark:text-warm-400 truncate">
                @{whisperProfile?.username || 'unknown'}
              </span>
            </div>
            <span className="text-xs text-warm-400 dark:text-warm-500">
              {formatDistanceToNow(new Date(whisper.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {isOwnWhisper && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors disabled:opacity-50"
            title="Delete whisper"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Mood Badge */}
      {whisper.mood && (
        <div className="mb-3">
          <MoodBadge mood={whisper.mood} size="sm" />
        </div>
      )}

      {/* Content */}
      <div
        onClick={handleWhisperClick}
        className="mb-4 cursor-pointer"
      >
        {renderRichContent(whisper.content)}
      </div>

      {/* Reactions */}
      <div className="flex items-center flex-wrap gap-2 pt-3 border-t border-warm-100 dark:border-warm-700">
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => handleReaction('felt')}
          disabled={reactionLoading !== null}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors duration-200 ${
            userReactions.felt
              ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
              : 'text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700'
          } disabled:opacity-50`}
        >
          <motion.div animate={userReactions.felt ? { scale: [1, 1.2, 1] } : {}}>
            <Heart size={16} fill={userReactions.felt ? 'currentColor' : 'none'} />
          </motion.div>
          <span className="text-xs font-medium">{reactionCounts.felt}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => handleReaction('warmth')}
          disabled={reactionLoading !== null}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors duration-200 ${
            userReactions.warmth
              ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300'
              : 'text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700'
          } disabled:opacity-50`}
        >
          <motion.div animate={userReactions.warmth ? { scale: [1, 1.2, 1] } : {}}>
            <Flame size={16} fill={userReactions.warmth ? 'currentColor' : 'none'} />
          </motion.div>
          <span className="text-xs font-medium">{reactionCounts.warmth}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => handleReaction('spark')}
          disabled={reactionLoading !== null}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors duration-200 ${
            userReactions.spark
              ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
              : 'text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700'
          } disabled:opacity-50`}
        >
          <motion.div animate={userReactions.spark ? { scale: [1, 1.2, 1] } : {}}>
            <Sparkles size={16} fill={userReactions.spark ? 'currentColor' : 'none'} />
          </motion.div>
          <span className="text-xs font-medium">{reactionCounts.spark}</span>
        </motion.button>

        <div className="flex-1" />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleBookmark}
          className={`p-2 rounded-full transition-colors ${
            isBookmarked
              ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-800'
          }`}
          title="Save Whisper"
        >
          <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          className="p-2 text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-full transition-colors"
          title="Share Whisper"
        >
          <Share2 size={16} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleWhisperClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors duration-200 text-xs font-medium"
        >
          {whisper.comment_count} {whisper.comment_count === 1 ? 'reply' : 'replies'}
        </motion.button>
      </div>
    </div>
  );
});
