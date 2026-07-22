import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Flame, Sparkles, Trash2, Share2, Bookmark, ExternalLink, Briefcase, BookOpen, Globe, Compass, Activity, Pin, EyeOff, MoreVertical, ShieldAlert, VolumeX, UserMinus } from 'lucide-react';
import { ModerationModal } from '../modals/ModerationModal';
import { ShareCreationModal } from '../modals/ShareCreationModal';
import { motion } from 'framer-motion';
import type { Whisper, Profile, Reaction } from '../../types';
import { Avatar } from '../common/Avatar';
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

  const [isPinned, setIsPinned] = useState(whisper.is_pinned || false);
  const [isRemoved, setIsRemoved] = useState(whisper.is_removed || false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationType, setModerationType] = useState<'user' | 'whisper' | 'comment'>('whisper');
  const [showShareModal, setShowShareModal] = useState(false);

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const chimeraUrl = isLocalhost ? 'http://localhost:5174' : 'https://chimera.whisprr.xyz';

  const isOwnWhisper = user?.id === whisper.user_id;

  const isModerator = (user && (user.id === communityOwnerId || (communityModerators && communityModerators.includes(user.id)))) ||
    profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'founder';

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !isPinned;
    setIsPinned(nextVal);
    try {
      const { error } = await supabase
        .from('whispers')
        .update({ is_pinned: nextVal })
        .eq('id', whisper.id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setIsPinned(!nextVal);
    }
  };

  const handleRemovePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this post from the community feed?")) return;
    setIsRemoved(true);
    try {
      const { error } = await supabase
        .from('whispers')
        .update({ is_removed: true, removed_by: user?.id, removed_at: new Date().toISOString() })
        .eq('id', whisper.id);
      if (error) throw error;
      if (onWhisperDeleted) onWhisperDeleted();
    } catch (err) {
      console.error(err);
      setIsRemoved(false);
    }
  };

  const handleApplyCollaboration = async (role: string, title: string, creatorUsername: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (user.id === whisper.user_id) {
      alert("You cannot apply to your own recruitment request.");
      return;
    }

    try {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', creatorUsername)
        .maybeSingle();

      if (!creatorProfile) {
        alert("Failed to find creator profile.");
        return;
      }

      // Check if DM exists
      const { data: existingParticipant } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      let existingConvId = null;
      if (existingParticipant && existingParticipant.length > 0) {
        const convIds = existingParticipant.map(p => p.conversation_id);
        const { data: commonPart } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('user_id', creatorProfile.user_id);
        if (commonPart && commonPart.length > 0) {
          const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', commonPart[0].conversation_id)
            .eq('type', 'dm')
            .maybeSingle();
          if (conv) {
            existingConvId = conv.id;
          }
        }
      }

      let convId = existingConvId;
      if (!convId) {
        const { data: newConv, error: newConvError } = await supabase
          .from('conversations')
          .insert({ type: 'dm' })
          .select('id')
          .single();

        if (newConvError) throw newConvError;
        convId = newConv.id;

        await supabase.from('conversation_participants').insert([
          { conversation_id: convId, user_id: user.id },
          { conversation_id: convId, user_id: creatorProfile.user_id }
        ]);
      }

      const appMsg = `Hi! I'd like to apply to your collaboration recruitment posting for "${role}" on the project "${title}".`;
      await supabase.from('messages').insert({
        conversation_id: convId,
        content: appMsg
      });

      await supabase.from('notifications').insert({
        user_id: creatorProfile.user_id,
        actor_id: user.id,
        type: 'collaboration_application',
        reference_id: whisper.id
      });

      alert("Successfully applied! A message has been sent to the creator.");
      navigate(`/messages/${convId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to apply to collaboration.");
    }
  };

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
          communityId: whisper.community_id || undefined,
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

  const handleShare = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowShareModal(true);
  }, []);

  const [isBookmarked, setIsBookmarked] = useState(
    whisper.bookmarks?.some(b => b.user_id === user?.id) || false
  );
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || bookmarkLoading) return;
    
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        setIsBookmarked(false);
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('whisper_id', whisper.id)
          .eq('user_id', user.id);
        
        if (error) {
          setIsBookmarked(true); // Revert on failure
          throw error;
        }
      } else {
        setIsBookmarked(true);
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            whisper_id: whisper.id,
            user_id: user.id
          });
          
        if (error) {
          setIsBookmarked(false); // Revert on failure
          throw error;
        }
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

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

    // 2. Check for Character: [Character: Name | Description | Greeting | Id]
    const charRegex = /\[Character:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|\]]+)(?:\s*\|\s*([^\]]+))?\]/i;
    const charMatch = content.match(charRegex);
    if (charMatch) {
      const name = charMatch[1].trim();
      const desc = charMatch[2].trim();
      const greeting = charMatch[3].trim();
      const charId = charMatch[4] ? charMatch[4].trim() : null;
      return (
        <div className="mb-4 p-5 bg-gradient-to-tr from-primary-500/5 to-accent-500/5 dark:from-primary-950/10 dark:to-accent-950/10 rounded-2xl border border-primary-100/50 dark:border-primary-900/30 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-500 flex items-center justify-center text-xl flex-shrink-0">
            🎭
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-warm-900 dark:text-white mb-0.5">{name}</h4>
            <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wide mb-2">Character Card Embed</p>
            <p className="text-sm text-warm-700 dark:text-warm-300 font-medium italic mb-2">"{greeting}"</p>
            <p className="text-xs text-warm-600 dark:text-warm-400 mb-3">{desc}</p>
            <a
              href={charId ? `${chimeraUrl}/chat/${charId}` : `${chimeraUrl}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:underline"
            >
              <span>Chat in CHIMERA</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      );
    }

    // 3. Check for Story: [Story: Title | Summary | CoverURL | StoryID]
    const storyRegex = /\[Story:\s*([^|]+)\s*\|\s*([^|]+)\s*(?:\|\s*([^|]*)\s*(?:\|\s*([^\]]+))?)?\]/i;
    const storyMatch = content.match(storyRegex);
    if (storyMatch) {
      const title = storyMatch[1].trim();
      const summary = storyMatch[2].trim();
      const coverUrl = storyMatch[3] ? storyMatch[3].trim() : null;
      const storyId = storyMatch[4] ? storyMatch[4].trim() : null;
      return (
        <div className="mb-4 p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-100 dark:border-warm-800 shadow-sm">
          {coverUrl && coverUrl !== "" && (
            <img src={coverUrl} alt={title} className="w-full h-32 object-cover rounded-xl mb-4" />
          )}
          <h4 className="font-serif text-lg font-bold text-warm-900 dark:text-white mb-2 flex items-center gap-1.5">
            📖 Story Preview: {title}
          </h4>
          <p className="text-sm text-warm-650 dark:text-warm-350 leading-relaxed font-serif mb-3">{summary}</p>
          <a
            href={storyId ? `${chimeraUrl}/story/${storyId}` : `${chimeraUrl}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:underline"
          >
            <span>Read in CHIMERA</span>
            <ExternalLink size={12} />
          </a>
        </div>
      );
    }

    // 4. Check for World: [World: Name | Description]
    const worldRegex = /\[World:\s*([^|]+)\s*\|\s*([^\]]+)\]/i;
    const worldMatch = content.match(worldRegex);
    if (worldMatch) {
      const name = worldMatch[1].trim();
      const desc = worldMatch[2].trim();
      return (
        <div className="mb-4 p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-100 dark:border-warm-800 shadow-sm flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl flex-shrink-0">
            🗺️
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-serif text-base font-bold text-warm-900 dark:text-white mb-1">{name}</h4>
            <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wide mb-2">World Card Embed</p>
            <p className="text-sm text-warm-650 dark:text-warm-350 mb-3">{desc}</p>
            <a
              href={`${chimeraUrl}/worlds`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:underline"
            >
              <span>Explore in CHIMERA</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      );
    }

    // 5. Check for Lorebook: [Lorebook: Title | Description | EntryCount]
    const lorebookRegex = /\[Lorebook:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]/i;
    const lorebookMatch = content.match(lorebookRegex);
    if (lorebookMatch) {
      const title = lorebookMatch[1].trim();
      const desc = lorebookMatch[2].trim();
      const entryCount = lorebookMatch[3].trim();
      return (
        <div className="mb-4 p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-100 dark:border-warm-800 shadow-sm flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl flex-shrink-0">
            📚
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-serif text-base font-bold text-warm-900 dark:text-white mb-1">{title}</h4>
            <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wide mb-2">Lorebook Embed &bull; {entryCount} entries</p>
            <p className="text-sm text-warm-650 dark:text-warm-350 mb-3">{desc}</p>
            <a
              href={`${chimeraUrl}/lorebooks`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:underline"
            >
              <span>Manage in CHIMERA</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      );
    }

    // 6. Check for Collaboration Card: [Collaboration: Role | Project Title | Description | CollabId | CreatorUsername]
    const collabRegex = /\[Collaboration:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|\]]+)(?:\s*\|\s*([^|\]]+))?(?:\s*\|\s*([^\]]+))?\]/i;
    const collabMatch = content.match(collabRegex);
    if (collabMatch) {
      const role = collabMatch[1].trim();
      const title = collabMatch[2].trim();
      const desc = collabMatch[3].trim();
      const creatorUsername = collabMatch[5] ? collabMatch[5].trim() : null;
      return (
        <div className="mb-4 p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-150 dark:border-warm-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                🔍 {role.replace('_', ' ')}
              </span>
            </div>
            <h4 className="font-bold text-warm-900 dark:text-white mb-2">{title}</h4>
            <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-4">{desc}</p>
          </div>
          {creatorUsername && user && creatorUsername !== profile?.username && (
            <div className="flex items-center justify-between pt-3 border-t border-warm-100 dark:border-warm-800">
              <span className="text-xs text-warm-500 font-semibold">by @{creatorUsername}</span>
              <button
                onClick={(e) => handleApplyCollaboration(role, title, creatorUsername, e)}
                className="text-xs btn-primary py-1 px-3"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      );
    }

    // 7. Check for Progress Update: [Progress: Project Name | Percentage% | Notes]
    const progressRegex = /\[Progress:\s*([^|]+)\s*\|\s*([^|%\]]+)%?\s*\|\s*([^\]]+)\]/i;
    const progressMatch = content.match(progressRegex);
    if (progressMatch) {
      const projectName = progressMatch[1].trim();
      const percentage = Math.min(Math.max(parseInt(progressMatch[2].trim()) || 0, 0), 100);
      const notes = progressMatch[3].trim();
      return (
        <div className="mb-4 p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-100 dark:border-warm-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-serif text-base font-bold text-warm-900 dark:text-white flex items-center gap-1.5">
              📈 Progress Update: {projectName}
            </h4>
            <span className="text-xs font-bold text-primary-500">{percentage}% Complete</span>
          </div>
          <div className="w-full bg-warm-100 dark:bg-warm-800 h-2.5 rounded-full overflow-hidden mb-4">
            <div className="bg-primary-500 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-sm text-warm-650 dark:text-warm-350 leading-relaxed italic">"{notes}"</p>
        </div>
      );
    }

    // 8. Check for Prompt Card
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

  if (isRemoved) return null;

  return (
    <div className="card mb-4 relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        {isPinned && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500 font-bold mb-2 uppercase tracking-wide">
            <Pin size={12} className="rotate-45 fill-current" />
            <span>Pinned Post</span>
          </div>
        )}
        <div
          className="flex items-start gap-3 flex-1 cursor-pointer"
          onClick={handleProfileClick}
        >
          <Avatar
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

        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-full transition-colors"
            title="More options"
          >
            <MoreVertical size={18} className="text-warm-500 hover:text-warm-700 transition-colors" />
          </button>
          
          {showDropdown && (
            <div 
              className="absolute right-0 top-8 w-48 bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl shadow-lg py-2 z-30 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {isOwnWhisper ? (
                <button
                  onClick={(e) => { setShowDropdown(false); handleDelete(); }}
                  disabled={isDeleting}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete Whisper
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setShowDropdown(false); setModerationType('whisper'); setShowModerationModal(true); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-warm-750 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750 transition-colors flex items-center gap-2"
                  >
                    <ShieldAlert size={14} /> Report Content
                  </button>
                  <button
                    onClick={() => { setShowDropdown(false); setModerationType('user'); setShowModerationModal(true); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-warm-750 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750 transition-colors flex items-center gap-2"
                  >
                    <VolumeX size={14} /> Mute @{whisperProfile?.username}
                  </button>
                  <button
                    onClick={() => { setShowDropdown(false); setModerationType('user'); setShowModerationModal(true); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors flex items-center gap-2"
                  >
                    <UserMinus size={14} /> Block @{whisperProfile?.username}
                  </button>
                </>
              )}

              {whisper.community_id && isModerator && (
                <>
                  <div className="border-t border-warm-100 dark:border-warm-750 my-1" />
                  <button
                    onClick={(e) => { setShowDropdown(false); handleTogglePin(e); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-500 hover:bg-warm-50 dark:hover:bg-warm-750 transition-colors flex items-center gap-2"
                  >
                    <Pin size={14} className="rotate-45" /> {isPinned ? 'Unpin Post' : 'Pin Post'}
                  </button>
                  {!isOwnWhisper && (
                    <button
                      onClick={(e) => { setShowDropdown(false); handleRemovePost(e); }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-red-500 hover:bg-warm-50 dark:hover:bg-warm-750 transition-colors flex items-center gap-2"
                    >
                      <EyeOff size={14} /> Remove Post
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>


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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors duration-200 ${userReactions.felt
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors duration-200 ${userReactions.warmth
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors duration-200 ${userReactions.spark
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
          disabled={bookmarkLoading}
          className={`p-2 rounded-full transition-colors ${isBookmarked
            ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-800'
            } ${bookmarkLoading ? 'opacity-50' : ''}`}
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
      {showModerationModal && (
        <ModerationModal
          onClose={() => setShowModerationModal(false)}
          targetUserId={whisper.user_id}
          targetUsername={whisperProfile?.username || 'unknown'}
          contentType={moderationType}
          contentId={whisper.id}
          onSuccess={() => {
            if (moderationType === 'user') {
              setIsRemoved(true);
            }
          }}
        />
      )}
      {showShareModal && (
        <ShareCreationModal
          onClose={() => setShowShareModal(false)}
          creationType="whisper"
          creationData={whisper}
        />
      )}
    </div>
  );
});
