import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenTool, Plus, BookOpen, Trash2, Edit, ChevronLeft, Globe, Eye, Settings, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Story, StoryChapter } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function WritersDeskPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Form states
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formGenre, setFormGenre] = useState('General');
  const [formTags, setFormTags] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formVisibility, setFormVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
  const [formStatus, setFormStatus] = useState<'ongoing' | 'completed' | 'hiatus'>('ongoing');

  useEffect(() => {
    if (profile?.user_id) {
      fetchStories();
    }
  }, [profile]);

  const fetchStories = async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (err: any) {
      showToast(err.message || 'Error fetching stories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async (storyId: string) => {
    try {
      setChaptersLoading(true);
      const { data, error } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true });

      if (error) throw error;
      setChapters(data || []);
    } catch (err: any) {
      showToast(err.message || 'Error fetching chapters', 'error');
    } finally {
      setChaptersLoading(false);
    }
  };

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    fetchChapters(story.id);
  };

  const handleBackToDashboard = () => {
    setSelectedStory(null);
    setChapters([]);
    fetchStories();
  };

  const handleOpenNewStory = () => {
    setFormTitle('');
    setFormSummary('');
    setFormGenre('General');
    setFormTags('');
    setFormCoverUrl('');
    setFormVisibility('public');
    setFormStatus('ongoing');
    setIsEditingStory(true);
  };

  const handleOpenEditStory = (story: Story) => {
    setFormTitle(story.title);
    setFormSummary(story.summary);
    setFormGenre(story.genre);
    setFormTags(story.tags ? story.tags.join(', ') : '');
    setFormCoverUrl(story.cover_url || '');
    setFormVisibility(story.visibility);
    setFormStatus(story.status);
    setIsEditingStory(true);
  };

  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return showToast('You must be logged in to save a story.', 'error');
    if (!formTitle.trim()) return showToast('Title is required', 'info');

    const tagsArray = formTags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);

    const payload = {
      user_id: profile.user_id,
      title: formTitle,
      summary: formSummary,
      genre: formGenre,
      tags: tagsArray,
      cover_url: formCoverUrl || null,
      visibility: formVisibility,
      status: formStatus
    };

    try {
      setLoading(true);
      if (selectedStory) {
        // Update
        const { error } = await supabase
          .from('stories')
          .update(payload)
          .eq('id', selectedStory.id);

        if (error) throw error;
        
        showToast('Story updated successfully', 'success');
        setSelectedStory(prev => prev ? { ...prev, ...payload } : null);
      } else {
        // Create
        const { data, error } = await supabase
          .from('stories')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        showToast('Story created successfully', 'success');
        handleSelectStory(data);
      }
      setIsEditingStory(false);
      fetchStories();
    } catch (err: any) {
      showToast(err.message || 'Error saving story', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story? This will permanently delete all chapters.')) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
      showToast('Story deleted', 'success');
      handleBackToDashboard();
    } catch (err: any) {
      showToast(err.message || 'Error deleting story', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!selectedStory) return;
    const nextChapterNumber = chapters.length + 1;
    const newChapterPayload = {
      story_id: selectedStory.id,
      title: `Chapter ${nextChapterNumber}`,
      content: '',
      chapter_number: nextChapterNumber,
      status: 'draft'
    };

    try {
      const { data, error } = await supabase
        .from('story_chapters')
        .insert(newChapterPayload)
        .select()
        .single();

      if (error) throw error;
      showToast('New draft chapter created', 'success');
      navigate(`/write/story/${selectedStory.id}/chapter/${data.id}`);
    } catch (err: any) {
      showToast(err.message || 'Error creating chapter', 'error');
    }
  };

  const handleDeleteChapter = async (e: React.MouseEvent, chapId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    try {
      const { error } = await supabase
        .from('story_chapters')
        .delete()
        .eq('id', chapId);

      if (error) throw error;
      showToast('Chapter deleted', 'success');
      if (selectedStory) fetchChapters(selectedStory.id);
    } catch (err: any) {
      showToast(err.message || 'Error deleting chapter', 'error');
    }
  };

  // Cross-Platform Share to WHISPRR Function
  const handleShareToWhisprr = async (story: Story) => {
    if (!profile?.user_id) return showToast('You must be logged in to share.', 'error');
    try {
      // 1. Create a Whisper card inside public.whispers
      const embedTag = `[Story: ${story.title} | ${story.summary || 'Read my new work on CHIMERA.'} | ${story.cover_url || ''} | ${story.id}]`;
      const whisperContent = `📖 **New Story Alert!** Just shared my work from CHIMERA!\n\n${embedTag}`;
      
      const { data: whisperData, error: whisperError } = await supabase
        .from('whispers')
        .insert({
          user_id: profile.user_id,
          content: whisperContent,
        })
        .select()
        .single();

      if (whisperError) throw whisperError;

      // 2. Update story table status
      const { error: storyUpdateError } = await supabase
        .from('stories')
        .update({
          shared_to_whisprr: true,
          whisprr_whisper_id: whisperData.id
        })
        .eq('id', story.id);

      if (storyUpdateError) throw storyUpdateError;

      showToast('Shared Story Card to WHISPRR!', 'success');
      if (selectedStory) {
        setSelectedStory(prev => prev ? { ...prev, shared_to_whisprr: true, whisprr_whisper_id: whisperData.id } : null);
      }
      fetchStories();
    } catch (err: any) {
      showToast(err.message || 'Error sharing to WHISPRR', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 pb-20 pt-10">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Story Metadata Editor Modal/View */}
        {isEditingStory ? (
          <div className="bg-white dark:bg-warm-850 rounded-3xl border border-warm-200/60 dark:border-warm-800 p-6 sm:p-8 shadow-lg">
            <h2 className="font-serif text-2xl font-bold text-warm-900 dark:text-white mb-6">
              {selectedStory ? 'Edit Story Details' : 'Create New Story'}
            </h2>
            <form onSubmit={handleSaveStory} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-warm-500 tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Enter story title..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-warm-500 tracking-wider mb-2">Summary / Short Pitch</label>
                <textarea
                  placeholder="Describe your story's plot, themes, and hooks..."
                  value={formSummary}
                  rows={4}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-warm-500 tracking-wider mb-2">Genre</label>
                  <select
                    value={formGenre}
                    onChange={(e) => setFormGenre(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
                  >
                    <option value="General">General</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Romance">Romance</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Horror">Horror</option>
                    <option value="Historical">Historical</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Drama">Drama</option>
                    <option value="Non-Fiction">Non-Fiction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-warm-500 tracking-wider mb-2">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="hiatus">Hiatus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-warm-500 tracking-wider mb-2">Cover Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formCoverUrl}
                  onChange={(e) => setFormCoverUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-warm-500 tracking-wider mb-2">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="fantasy, slowburn, magic, dragons"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-warm-500 tracking-wider mb-2">Visibility</label>
                <select
                  value={formVisibility}
                  onChange={(e) => setFormVisibility(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
                >
                  <option value="public">Public (Visible to everyone & shareable)</option>
                  <option value="unlisted">Unlisted (Only accessible via link)</option>
                  <option value="private">Private (Only visible to you)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-warm-150 dark:border-warm-800">
                <button
                  type="button"
                  onClick={() => setIsEditingStory(false)}
                  className="px-5 py-2.5 rounded-xl border border-warm-250 dark:border-warm-700 text-warm-650 dark:text-warm-300 font-semibold hover:bg-warm-50 dark:hover:bg-warm-800 text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all"
                >
                  Save Story
                </button>
              </div>
            </form>
          </div>
        ) : selectedStory ? (
          /* Single Story Management Desk */
          <div>
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-warm-500 hover:text-warm-900 dark:hover:text-white font-semibold text-sm mb-6 transition-all"
            >
              <ChevronLeft size={16} />
              Back to Workspace
            </button>

            {/* Story Details Card */}
            <div className="bg-white dark:bg-warm-850 rounded-3xl border border-warm-200/60 dark:border-warm-800 p-6 flex flex-col md:flex-row gap-6 shadow-sm mb-8">
              <div className="w-full md:w-32 h-44 bg-warm-100 dark:bg-warm-800 rounded-2xl overflow-hidden flex-shrink-0">
                {selectedStory.cover_url ? (
                  <img src={selectedStory.cover_url} alt={selectedStory.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600/10 to-amber-600/15 flex items-center justify-center">
                    <BookOpen size={32} className="text-red-500/20" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md">
                      {selectedStory.genre}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-warm-600 dark:text-warm-400 bg-warm-100 dark:bg-warm-800 px-2 py-0.5 rounded-md">
                      {selectedStory.visibility}
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-warm-900 dark:text-white mt-2">
                    {selectedStory.title}
                  </h2>
                  <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mt-2">
                    {selectedStory.summary || 'No summary provided.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-warm-100 dark:border-warm-800">
                  <button
                    onClick={() => handleOpenEditStory(selectedStory)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-warm-750 dark:text-warm-300 border border-warm-200 dark:border-warm-750 rounded-xl hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                  >
                    <Edit size={14} />
                    Edit Details
                  </button>
                  
                  {/* Share to WHISPRR */}
                  {selectedStory.visibility === 'public' && (
                    <button
                      onClick={() => handleShareToWhisprr(selectedStory)}
                      disabled={selectedStory.shared_to_whisprr}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                        selectedStory.shared_to_whisprr
                          ? 'text-green-600 border-green-200/50 bg-green-50 dark:bg-green-950/10 dark:border-green-900/30'
                          : 'text-primary-600 border-primary-200 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-900/30 dark:hover:bg-primary-950/20'
                      }`}
                    >
                      <Share2 size={14} />
                      {selectedStory.shared_to_whisprr ? 'Shared to WHISPRR' : 'Share to WHISPRR'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteStory(selectedStory.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-650 border border-red-200/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors ml-auto"
                  >
                    <Trash2 size={14} />
                    Delete Story
                  </button>
                </div>
              </div>
            </div>

            {/* Chapters Workspace */}
            <div className="bg-white dark:bg-warm-850 rounded-3xl border border-warm-200/60 dark:border-warm-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-warm-100 dark:border-warm-800">
                <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white">Chapters & Drafts</h3>
                <button
                  onClick={handleCreateChapter}
                  className="flex items-center gap-1.5 bg-red-650 hover:bg-red-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all"
                >
                  <Plus size={14} />
                  Add Chapter
                </button>
              </div>

              {chaptersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(n => (
                    <div key={n} className="animate-pulse h-16 bg-warm-50 dark:bg-warm-800 rounded-xl border border-warm-200/40" />
                  ))}
                </div>
              ) : chapters.length === 0 ? (
                <div className="text-center py-12">
                  <PenTool className="mx-auto text-warm-300 mb-3" size={32} />
                  <h4 className="text-sm font-semibold text-warm-800 dark:text-white">Write your first chapter</h4>
                  <p className="text-xs text-warm-500 mt-1">Ready to start? Create a chapter draft to launch the editor.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map((chap) => (
                    <div
                      key={chap.id}
                      onClick={() => navigate(`/write/story/${selectedStory.id}/chapter/${chap.id}`)}
                      className="group/item flex items-center justify-between p-4 rounded-2xl border border-warm-150 dark:border-warm-800 hover:border-red-200 dark:hover:border-red-950/30 bg-warm-50/50 dark:bg-warm-900/30 hover:bg-white dark:hover:bg-warm-850 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-warm-400 group-hover/item:text-red-500 transition-colors w-6">
                          #{chap.chapter_number}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-warm-800 dark:text-white line-clamp-1">{chap.title}</h4>
                          <span className={`text-[10px] uppercase font-bold tracking-wider mt-1 inline-block ${
                            chap.status === 'published' ? 'text-green-600 dark:text-green-500' : 'text-amber-600 dark:text-amber-500'
                          }`}>
                            {chap.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteChapter(e, chap.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-warm-400 hover:text-red-650 transition-colors opacity-0 group-hover/item:opacity-100"
                          title="Delete Chapter"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Workspace Dashboard */
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400 rounded-2xl">
                  <PenTool size={24} />
                </div>
                <div>
                  <h1 className="font-serif text-3xl font-bold text-warm-900 dark:text-white">Writer's Desk</h1>
                  <p className="text-sm text-warm-500 mt-1">Manage your books, drafts, and edit chapters.</p>
                </div>
              </div>
              <button
                onClick={handleOpenNewStory}
                className="flex items-center gap-2 bg-red-650 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-102 active:scale-98"
              >
                <Plus size={18} />
                New Story
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((n) => (
                  <div key={n} className="animate-pulse bg-white dark:bg-warm-850 rounded-2xl h-44 border border-warm-200/50 dark:border-warm-800" />
                ))}
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200/60 dark:border-warm-800 p-8">
                <BookOpen className="mx-auto text-warm-300 mb-4" size={48} />
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-white">No stories yet</h3>
                <p className="text-warm-500 text-sm mt-2 max-w-sm mx-auto">
                  Create your first story to start writing chapters, building lore, and organizing timelines.
                </p>
                <button
                  onClick={handleOpenNewStory}
                  className="mt-6 bg-red-650 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Create Story Outline
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => handleSelectStory(story)}
                    className="group bg-white dark:bg-warm-850 rounded-2xl border border-warm-200/60 dark:border-warm-800 p-5 flex flex-col justify-between hover:shadow-md hover:border-red-200 dark:hover:border-red-950/20 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md">
                          {story.genre}
                        </span>
                        <span className="text-xs text-warm-400">
                          {story.visibility}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white mt-3 group-hover:text-red-650 transition-colors line-clamp-1">
                        {story.title}
                      </h3>
                      <p className="text-xs text-warm-500 mt-2 line-clamp-2 leading-relaxed">
                        {story.summary || 'No summary provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-warm-100 dark:border-warm-800 text-[11px] font-semibold text-warm-400 uppercase tracking-wide">
                      <span>Status: {story.status}</span>
                      <span className="text-red-500 group-hover:translate-x-1 transition-transform">Manage Desk &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
