import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Flame, Sparkles, Trash2 } from 'lucide-react';
import type { Whisper, Profile, Reaction } from '../../types';
import { Avatar } from '../common/Avatar';
import { MoodBadge } from '../common/MoodBadge';
import UserBadges from '../common/UserBadges';
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
}

export function WhisperCard({
  whisper,
  onWhisperDeleted,
  onReactionChange,
}: WhisperCardProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { track } = useInterests();
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactionLoading, setReactionLoading] = useState<string | null>(null);

  const isOwnWhisper = user?.id === whisper.user_id;

  // Count reactions by type
  const reactionCounts = {
    felt: whisper.reactions.filter(r => r.type === 'felt').length,
    warmth: whisper.reactions.filter(r => r.type === 'warmth').length,
    spark: whisper.reactions.filter(r => r.type === 'spark').length,
  };

  // Check if current user has reacted with each type
  const userReactions = {
    felt: whisper.reactions.some(r => r.user_id === user?.id && r.type === 'felt'),
    warmth: whisper.reactions.some(r => r.user_id === user?.id && r.type === 'warmth'),
    spark: whisper.reactions.some(r => r.user_id === user?.id && r.type === 'spark'),
  };

  const handleReaction = async (type: 'felt' | 'warmth' | 'spark') => {
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
  };

  const handleDelete = async () => {
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
  };

  const handleUserClick = () => {
    navigate(`/profile/${whisper.profiles.username}`);
  };

  const handleWhisperClick = () => {
    navigate(`/whisper/${whisper.id}`);
  };

  return (
    <div className="card mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-start gap-3 flex-1 cursor-pointer"
          onClick={handleUserClick}
        >
          <Avatar
            emoji={whisper.profiles.avatar_emoji}
            photoUrl={whisper.profiles.photo_url}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-warm-900 dark:text-warm-50 truncate">
                {whisper.profiles.display_name}
              </span>
              <UserBadges badges={whisper.profiles.badges} size="sm" />
              <span className="text-sm text-warm-500 dark:text-warm-400 truncate">
                @{whisper.profiles.username}
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
        <p className="font-serif text-base leading-relaxed text-warm-800 dark:text-warm-100 whitespace-pre-wrap break-words">
          {whisper.content}
        </p>
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-3 pt-3 border-t border-warm-100 dark:border-warm-700">
        <button
          onClick={() => handleReaction('felt')}
          disabled={reactionLoading !== null}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            userReactions.felt
              ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
              : 'text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700'
          } disabled:opacity-50`}
        >
          <Heart size={16} fill={userReactions.felt ? 'currentColor' : 'none'} />
          <span className="text-xs font-medium">{reactionCounts.felt}</span>
        </button>

        <button
          onClick={() => handleReaction('warmth')}
          disabled={reactionLoading !== null}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            userReactions.warmth
              ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300'
              : 'text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700'
          } disabled:opacity-50`}
        >
          <Flame size={16} fill={userReactions.warmth ? 'currentColor' : 'none'} />
          <span className="text-xs font-medium">{reactionCounts.warmth}</span>
        </button>

        <button
          onClick={() => handleReaction('spark')}
          disabled={reactionLoading !== null}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            userReactions.spark
              ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
              : 'text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700'
          } disabled:opacity-50`}
        >
          <Sparkles size={16} fill={userReactions.spark ? 'currentColor' : 'none'} />
          <span className="text-xs font-medium">{reactionCounts.spark}</span>
        </button>

        <button
          onClick={handleWhisperClick}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700 transition-all duration-200 text-xs font-medium"
        >
          {whisper.comment_count} {whisper.comment_count === 1 ? 'reply' : 'replies'}
        </button>
      </div>
    </div>
  );
}
