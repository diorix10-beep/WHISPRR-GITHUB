import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Bookmark, Heart, Send, ArrowLeft, Plus, Eye, Share2, Sparkles, MessageSquare, Users, ChevronRight } from 'lucide-react';
import { CollaboratorsModal } from '../components/collaboration/CollaboratorsModal';
import { supabase } from '../lib/supabase';
import { Story, StoryChapter, StoryComment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function StoryReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Interaction states
  const [inLibrary, setInLibrary] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStoryDetails();
      fetchInteractions();
    }
  }, [id, profile]);

  const fetchStoryDetails = async () => {
    try {
      setLoading(true);
      // Fetch story and author info
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            avatar_emoji,
            photo_url
          )
        `)
        .eq('id', id)
        .single();

      if (storyError) throw storyError;
      setStory(storyData);

      // Fetch published chapters
      const { data: chapterData, error: chapError } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('story_id', id)
        .eq('status', 'published')
        .order('chapter_number', { ascending: true });

      if (chapError) throw chapError;
      setChapters(chapterData || []);

      // Fetch comments
      const { data: commentData, error: commError } = await supabase
        .from('story_comments')
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            avatar_emoji,
            photo_url
          )
        `)
        .eq('story_id', id)
        .order('created_at', { ascending: false });

      if (commError) throw commError;
      setComments(commentData || []);

    } catch (err: any) {
      showToast(err.message || 'Error loading story details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async () => {
    if (!profile?.user_id || !id) return;
    try {
      // Check library status
      const { data: libData } = await supabase
        .from('story_library')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('story_id', id)
        .maybeSingle();
      
      setInLibrary(!!libData);

      // Check vote status
      const { data: voteData } = await supabase
        .from('story_votes')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('story_id', id)
        .maybeSingle();

      setHasVoted(!!voteData);
    } catch (err) {
      console.error('Error fetching interactions:', err);
    }
  };

  const handleToggleLibrary = async () => {
    if (!profile?.user_id) return showToast('Please log in to add to your library', 'info');
    try {
      if (inLibrary) {
        // Delete
        const { error } = await supabase
          .from('story_library')
          .delete()
          .eq('user_id', profile.user_id)
          .eq('story_id', id);

        if (error) throw error;
        setInLibrary(false);
        showToast('Removed from library', 'success');
      } else {
        // Insert
        const { error } = await supabase
          .from('story_library')
          .insert({
            user_id: profile.user_id,
            story_id: id
          });

        if (error) throw error;
        setInLibrary(true);
        showToast('Added to library', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating library status', 'error');
    }
  };

  const handleToggleVote = async () => {
    if (!profile?.user_id) return showToast('Please log in to vote', 'info');
    try {
      if (hasVoted) {
        // Delete
        const { error } = await supabase
          .from('story_votes')
          .delete()
          .eq('user_id', profile.user_id)
          .eq('story_id', id);

        if (error) throw error;
        setHasVoted(false);
        setStory(prev => prev ? { ...prev, votes_count: (prev.votes_count || 1) - 1 } : null);
        showToast('Vote removed', 'success');
      } else {
        // Insert
        const { error } = await supabase
          .from('story_votes')
          .insert({
            user_id: profile.user_id,
            story_id: id
          });

        if (error) throw error;
        setHasVoted(true);
        setStory(prev => prev ? { ...prev, votes_count: (prev.votes_count || 0) + 1 } : null);
        showToast('Story upvoted!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating vote status', 'error');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!profile?.user_id) return showToast('Please log in to comment', 'info');

    try {
      setCommenting(true);
      const { data, error } = await supabase
        .from('story_comments')
        .insert({
          story_id: id,
          user_id: profile.user_id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            avatar_emoji,
            photo_url
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [data, ...prev]);
      setNewComment('');
      showToast('Comment posted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error posting comment', 'error');
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-red-750 mx-auto" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex flex-col items-center justify-center p-8">
        <h2 className="font-serif text-2xl font-bold text-warm-900 dark:text-white">Story not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 bg-red-650 text-white font-semibold px-4 py-2 rounded-xl">
          Back to Explore
        </button>
      </div>
    );
  }

  const author = story.profiles;

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Cover + Overview Header */}
        <div className="bg-white dark:bg-warm-850 rounded-[2rem] border border-warm-200/60 dark:border-warm-800 p-6 sm:p-8 flex flex-col md:flex-row gap-8 shadow-sm mb-8">
          {/* Cover Art */}
          <div className="w-full md:w-44 h-60 bg-warm-100 dark:bg-warm-800 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
            {story.cover_url ? (
              <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-600/10 to-amber-600/15 flex items-center justify-center">
                <BookOpen size={48} className="text-red-500/20" />
              </div>
            )}
          </div>

          {/* Details Overview */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs uppercase font-bold tracking-wider text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-1 rounded-md">
                  {story.genre}
                </span>
                <span className="text-xs uppercase font-bold tracking-wider text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-md">
                  {story.status}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-warm-900 dark:text-white mt-3 leading-tight">
                {story.title}
              </h1>

              {/* Author Row */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xl">{author?.avatar_emoji || '✍️'}</span>
                <p className="text-sm text-warm-650 dark:text-warm-350">
                  by <span className="font-bold text-warm-800 dark:text-white">@{author?.username || 'creator'}</span>
                </p>
              </div>

              {/* Tags */}
              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {story.tags.map(tag => (
                    <span key={tag} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-warm-100 dark:bg-warm-800 text-warm-650 dark:text-warm-350">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Interaction Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-warm-150 dark:border-warm-800">
              {chapters.length > 0 ? (
                <button
                  onClick={() => navigate(`/story/${story.id}/chapter/1`)}
                  className="flex items-center gap-2 bg-red-650 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all hover:scale-103 active:scale-97"
                >
                  <BookOpen size={18} />
                  Read First Chapter
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 bg-warm-200 dark:bg-warm-800 text-warm-450 dark:text-warm-550 font-bold px-6 py-3 rounded-xl cursor-not-allowed"
                >
                  <BookOpen size={18} />
                  No Chapters Published
                </button>
              )}

              {/* Add to Library */}
              <button
                onClick={handleToggleLibrary}
                className={`p-3 rounded-xl border transition-all ${
                  inLibrary
                    ? 'bg-red-50 dark:bg-red-950/20 text-red-650 border-red-200 dark:border-red-900/30'
                    : 'bg-white dark:bg-warm-800 text-warm-600 dark:text-warm-400 border-warm-250 dark:border-warm-700 hover:bg-warm-50 dark:hover:bg-warm-750'
                }`}
                title={inLibrary ? 'Remove from Library' : 'Save to Library'}
              >
                <Bookmark size={20} className={inLibrary ? 'fill-current' : ''} />
              </button>

              {/* Vote */}
              <button
                onClick={handleToggleVote}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  hasVoted
                    ? 'bg-red-50 dark:bg-red-950/20 text-red-650 border-red-200 dark:border-red-900/30'
                    : 'bg-white dark:bg-warm-800 text-warm-600 dark:text-warm-400 border-warm-250 dark:border-warm-700 hover:bg-warm-50 dark:hover:bg-warm-750'
                }`}
                title={hasVoted ? 'Remove Vote' : 'Upvote Story'}
              >
                <Heart size={20} className={hasVoted ? 'fill-current text-red-500' : ''} />
                <span className="text-xs font-bold">{story.votes_count || 0}</span>
              </button>

              {/* Co-Creators / Share Collaboration */}
              <button
                onClick={() => setIsCollabModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-white dark:bg-warm-800 text-warm-600 dark:text-warm-400 border-warm-250 dark:border-warm-700 hover:bg-warm-50 dark:hover:bg-warm-750 transition-all text-xs font-bold"
                title="Manage Co-Creators"
              >
                <Users size={18} className="text-red-500" />
                <span>Co-Creators</span>
              </button>
            </div>
          </div>
        </div>

        {/* Story Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info (Left Column: Summary & Chapters) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Story Pitch/Summary */}
            <div className="bg-white dark:bg-warm-850 rounded-[1.5rem] border border-warm-200/60 dark:border-warm-800 p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-warm-900 dark:text-white mb-4">Synopsis</h2>
              <p className="text-warm-700 dark:text-warm-200 text-sm leading-relaxed whitespace-pre-line font-serif">
                {story.summary || 'No overview has been added to this story.'}
              </p>
            </div>

            {/* Table of Contents */}
            <div className="bg-white dark:bg-warm-850 rounded-[1.5rem] border border-warm-200/60 dark:border-warm-800 p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-warm-900 dark:text-white mb-4">Table of Contents</h2>
              
              {chapters.length === 0 ? (
                <div className="text-center py-6 text-warm-500 text-xs">
                  The author has not published any chapters yet.
                </div>
              ) : (
                <div className="divide-y divide-warm-100 dark:divide-warm-800">
                  {chapters.map((chap) => (
                    <div
                      key={chap.id}
                      onClick={() => navigate(`/story/${story.id}/chapter/${chap.chapter_number}`)}
                      className="flex items-center justify-between py-3.5 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-warm-400 group-hover:text-red-500 transition-colors w-6">
                          {chap.chapter_number}
                        </span>
                        <h4 className="text-sm font-semibold text-warm-800 dark:text-warm-200 group-hover:text-red-650 transition-colors line-clamp-1">
                          {chap.title}
                        </h4>
                      </div>
                      <ChevronRight size={16} className="text-warm-450 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section (Right Column) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-warm-850 rounded-[1.5rem] border border-warm-200/60 dark:border-warm-800 p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-warm-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare size={18} />
                Comments
              </h2>

              {/* Add Comment Form */}
              <form onSubmit={handlePostComment} className="mb-6">
                <textarea
                  placeholder="Share your thoughts on the story..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white resize-none"
                />
                <button
                  type="submit"
                  disabled={commenting || !newComment.trim()}
                  className="w-full mt-2 bg-red-650 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {commenting ? 'Posting...' : 'Post Comment'}
                </button>
              </form>

              {/* Comments Feed */}
              {comments.length === 0 ? (
                <div className="text-center py-6 text-warm-400 text-[11px]">
                  No comments yet. Be the first to start the discussion!
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {comments.map((comm) => {
                    const cAuthor = comm.profiles;
                    return (
                      <div key={comm.id} className="text-xs border-b border-warm-100 dark:border-warm-800 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{cAuthor?.avatar_emoji || '✍️'}</span>
                          <div>
                            <span className="font-bold text-warm-800 dark:text-white">@{cAuthor?.username || 'user'}</span>
                            <span className="text-[9px] text-warm-450 block">
                              {new Date(comm.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-warm-700 dark:text-warm-350 leading-relaxed pl-1 font-sans">
                          {comm.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      {/* Collaborators Modal */}
      {story && (
        <CollaboratorsModal
          projectId={story.id}
          projectType="story"
          projectTitle={story.title}
          isOpen={isCollabModalOpen}
          onClose={() => setIsCollabModalOpen(false)}
        />
      )}
    </div>
  );
}
