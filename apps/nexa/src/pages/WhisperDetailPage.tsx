import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Send } from 'lucide-react';
import type { Whisper, Profile, Reaction, Comment } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useInterests } from '../contexts/InterestContext';
import { WhisperCard } from '../components/feed/WhisperCard';
import { Avatar } from '../components/common/Avatar';
import { UserBadges } from '../components/common/UserBadges';

interface WhisperWithRelations extends Whisper {
  profiles: Profile;
  reactions: Reaction[];
  comment_count: number;
}

interface CommentWithProfile extends Comment {
  profiles?: Profile;
}

export default function WhisperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { track } = useInterests();

  const [whisper, setWhisper] = useState<WhisperWithRelations | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // Fetch whisper details
  const loadWhisper = async () => {
    if (!id) return;

    try {
      setError(null);
      const { data: whisperData, error: whisperError } = await supabase
        .from('whispers')
        .select(
          `
          *,
          profiles:user_id(
            id, user_id, display_name, username, avatar_emoji, photo_url, bio, badges, mood, badges
          ),
          reactions(id, whisper_id, user_id, type, created_at)
        `
        )
        .eq('id', id)
        .single();

      if (whisperError) {
        throw whisperError;
      }

      if (whisperData) {
        // Fetch comment count
        const { data: commentData, error: commentError } = await supabase
          .from('whispers')
          .select('id')
          .eq('parent_id', id);

        if (commentError) {
          console.error('Error fetching comment count:', commentError);
        }

        const whisperWithCount: WhisperWithRelations = {
          ...whisperData,
          profiles: whisperData.profiles,
          reactions: whisperData.reactions || [],
          comment_count: commentData?.length || 0,
        };

        setWhisper(whisperWithCount);
      }
    } catch (err) {
      console.error('Error loading whisper:', err);
      setError('Failed to load whisper. Please try again.');
    }
  };

  // Fetch comments
  const loadComments = async () => {
    if (!id) return;

    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(
          `
          *,
          profiles:user_id(
            id, user_id, display_name, username, avatar_emoji, photo_url, bio, badges
          )
        `
        )
        .eq('whisper_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) {
        throw commentsError;
      }

      if (commentsData) {
        setComments(commentsData as CommentWithProfile[]);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadWhisper();
    loadComments();
    setIsLoading(false);
  }, [id]);

  // Build comment tree structure
  const buildCommentTree = (flatComments: CommentWithProfile[]) => {
    const commentMap = new Map<string, CommentWithProfile & { children: any[] }>();

    // Initialize all comments with empty children arrays
    flatComments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    // Build tree structure
    const rootComments: (CommentWithProfile & { children: any[] })[] = [];
    flatComments.forEach((comment) => {
      const commentNode = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parentNode = commentMap.get(comment.parent_id);
        if (parentNode) {
          parentNode.children.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    return rootComments;
  };

  const handleAddComment = async (
    content: string,
    parentId: string | null = null
  ) => {
    if (!user || !profile || !id || !content.trim()) return;

    setIsSubmitting(true);
    try {
      // Insert comment
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert({
          whisper_id: id,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId,
        })
        .select(
          `
          *,
          profiles:user_id(
            id, user_id, display_name, username, avatar_emoji, photo_url, bio, badges
          )
        `
        )
        .single();

      if (commentError) {
        throw commentError;
      }

      if (commentData) {
        setComments([...comments, commentData as CommentWithProfile]);

        // Track comment interest
        if (whisper) {
          track({
            eventType: 'comment',
            targetType: 'whisper',
            targetId: whisper.id,
            mood: whisper.mood || undefined,
            communityId: whisper.community_id || undefined,
            interests: whisper.mood ? [whisper.mood] : undefined,
          });
        }

        // Create notification for whisper owner (only if this is a root comment)
        if (!parentId && whisper && whisper.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: whisper.user_id,
            actor_id: user.id,
            type: 'comment',
            reference_id: id,
          });
        }

        // Reset text inputs
        setNewCommentText('');
        setReplyingTo(null);
        setReplyTexts({ ...replyTexts, [parentId || 'root']: '' });

        // Reload whisper to update comment count
        await loadWhisper();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CommentThread = ({
    comment,
    depth = 0,
  }: {
    comment: CommentWithProfile & { children: any[] };
    depth?: number;
  }) => {
    const isReplying = replyingTo === comment.id;
    const replyText = replyTexts[comment.id] || '';

    return (
      <div
        key={comment.id}
        className={`${depth > 0 ? 'ml-8 border-l-2 border-warm-200 dark:border-warm-700 pl-4' : ''}`}
      >
        {/* Comment Card */}
        <div className="card mb-4">
          <div className="flex items-start gap-3">
            {comment.profiles && (
              <Avatar
                emoji={comment.profiles.avatar_emoji}
                photoUrl={comment.profiles.photo_url}
                size="md"
              />
            )}

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-semibold text-warm-900 dark:text-warm-50">
                  {comment.profiles?.display_name || 'Anonymous'}
                </span>
                <UserBadges badges={comment.profiles?.badges} role={comment.profiles?.role} size="sm" />
                <span className="text-sm text-warm-500 dark:text-warm-400">
                  @{comment.profiles?.username || 'unknown'}
                </span>
                <span className="text-xs text-warm-400 dark:text-warm-500 ml-auto flex-shrink-0">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Content */}
              <p className="text-warm-800 dark:text-warm-100 whitespace-pre-wrap break-words mb-3">
                {comment.content}
              </p>

              {/* Reply Button */}
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                className="text-xs font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            </div>
          </div>

          {/* Reply Input (if replying) */}
          {isReplying && (
            <div className="mt-4 pt-4 border-t border-warm-200 dark:border-warm-700">
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) =>
                    setReplyTexts({ ...replyTexts, [comment.id]: e.target.value })
                  }
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 rounded-lg bg-warm-50 dark:bg-warm-700 border border-warm-200 dark:border-warm-600 text-warm-900 dark:text-warm-50 placeholder-warm-500 dark:placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment(replyText, comment.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleAddComment(replyText, comment.id)}
                  disabled={!replyText.trim() || isSubmitting}
                  className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Send reply"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {comment.children && comment.children.length > 0 && (
          <div className="space-y-4">
            {comment.children.map((child) => (
              <CommentThread key={child.id} comment={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-300 border-t-primary-500 mx-auto mb-4" />
            <p className="text-warm-600 dark:text-warm-400">Loading whisper...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!whisper) {
    return (
      <div className="page-container">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🤔</div>
          <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-2">
            Whisper not found
          </h2>
          <p className="text-warm-600 dark:text-warm-400 mb-6">
            This whisper may have been deleted or doesn't exist.
          </p>
          <button onClick={() => navigate('/feed')} className="btn-primary">
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const commentTree = buildCommentTree(comments);

  return (
    <div className="page-container">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-2xl">
          {error}
        </div>
      )}

      {/* Whisper Card */}
      <div className="mb-6">
        <WhisperCard
          whisper={whisper}
          onReactionChange={loadWhisper}
          onWhisperDeleted={() => navigate('/feed')}
        />
      </div>

      {/* Comments Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-4">
          {comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {/* Comments List */}
        {commentTree.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-warm-600 dark:text-warm-400 mb-4">
              No replies yet. Be the first to respond!
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {commentTree.map((comment) => (
              <CommentThread key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>

      {/* New Comment Input */}
      {user && profile && (
        <div className="card">
          <div className="flex items-end gap-3">
            <Avatar
              emoji={profile.avatar_emoji}
              photoUrl={profile.photo_url}
              size="md"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="flex-1 px-4 py-3 rounded-lg bg-warm-50 dark:bg-warm-700 border border-warm-200 dark:border-warm-600 text-warm-900 dark:text-warm-50 placeholder-warm-500 dark:placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment(newCommentText);
                    }
                  }}
                />
                <button
                  onClick={() => handleAddComment(newCommentText)}
                  disabled={!newCommentText.trim() || isSubmitting}
                  className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Send reply"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div className="text-center py-8 text-warm-600 dark:text-warm-400">
          <p>Sign in to reply to this whisper.</p>
        </div>
      )}
    </div>
  );
}
