import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, ChevronRight, ChevronLeft, Send, Eye, BookOpen, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Story, StoryChapter } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'oracle';
  content: string;
  timestamp: Date;
}

export default function ChapterEditorPage() {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<StoryChapter | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [saving, setSaving] = useState(false);

  // Oracle Sidebar states
  const [showOracle, setShowOracle] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [oracleInput, setOracleInput] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storyId && chapterId) {
      fetchData();
    }
  }, [storyId, chapterId]);

  useEffect(() => {
    if (showOracle) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, oracleLoading, showOracle]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Story Details
      const { data: storyData } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      setStory(storyData);

      // Fetch Active Chapter Details
      const { data: chapData, error } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      setChapter(chapData);
      setTitle(chapData.title);
      setContent(chapData.content || '');
      setStatus(chapData.status);

      // Send initial oracle contextual greeting
      setMessages([
        {
          id: 'welcome',
          role: 'oracle',
          content: `Welcome to the Oracle Workspace, partner! I'm here quietly in the sidebar to assist your writing. Highlight a paragraph or click one of the brainstorm prompts below whenever you want to discuss ideas or check continuity.`,
          timestamp: new Date()
        }
      ]);

    } catch (err: any) {
      showToast(err.message || 'Error loading chapter details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (publishStatus?: 'draft' | 'published') => {
    const activeStatus = publishStatus || status;
    try {
      setSaving(true);
      const payload: Partial<StoryChapter> = {
        title,
        content,
        status: activeStatus,
        updated_at: new Date().toISOString()
      };

      if (activeStatus === 'published') {
        payload.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('story_chapters')
        .update(payload)
        .eq('id', chapterId);

      if (error) throw error;
      
      setStatus(activeStatus);
      showToast(activeStatus === 'published' ? 'Chapter Published!' : 'Draft Saved Successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error saving chapter', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Oracle AI Interaction logic
  const handleSendToOracle = async (customText?: string) => {
    const textToSend = customText || oracleInput.trim();
    if (!textToSend || oracleLoading) return;

    if (!customText) setOracleInput('');

    // Append user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setOracleLoading(true);

    try {
      // Build prompt request
      const res = await fetch('/api/oracle-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          context_page: 'Writer Desk Chapter Editor',
          context_details: `The author is writing a story titled "${story?.title || ''}" (Genre: ${story?.genre || ''}). Current Chapter Title: "${title}". Chapter content summary: ${content.slice(0, 1000)}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Append Oracle message
      setMessages(prev => [...prev, {
        id: `oracle-${Date.now()}`,
        role: 'oracle',
        content: data.response,
        timestamp: new Date()
      }]);

    } catch (err: any) {
      showToast(err.message || 'Oracle is sleeping, please try again.', 'error');
    } finally {
      setOracleLoading(false);
    }
  };

  const triggerBrainstorm = (type: 'outline' | 'pacing' | 'inconsistencies') => {
    let prompt = '';
    if (type === 'outline') {
      prompt = `Review my current draft for Chapter "${title}" and brainstorm 3 possible paths/plot beats for what should happen next. Here is my draft:\n\n${content.slice(0, 2000)}`;
    } else if (type === 'pacing') {
      prompt = `Critique the pacing and narrative description in my active chapter draft. Point out any parts that feel rushed or overly descriptive:\n\n${content.slice(0, 2000)}`;
    } else {
      prompt = `Check for logical inconsistencies in this chapter draft. Verify if character actions, dialogue, or events seem contradictory:\n\n${content.slice(0, 2000)}`;
    }
    handleSendToOracle(prompt);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-red-750 mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex flex-col">
      
      {/* Editor Navbar */}
      <header className="bg-white dark:bg-warm-850 border-b border-warm-200 dark:border-warm-800 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/write`)}
            className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-850 text-warm-650 dark:text-warm-350"
            title="Exit to Workspace"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xs text-warm-500 font-semibold">{story?.title}</h1>
            <span className="text-[10px] text-warm-400 block">Editing Chapter #{chapter?.chapter_number}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {status === 'draft' ? (
            <>
              <button
                onClick={() => handleSaveDraft('draft')}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-warm-250 dark:border-warm-750 text-warm-700 dark:text-warm-300 font-bold text-xs hover:bg-warm-50 dark:hover:bg-warm-800 transition-all"
              >
                <Save size={14} />
                Save Draft
              </button>
              <button
                onClick={() => handleSaveDraft('published')}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-650 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Globe size={14} />
                Publish Chapter
              </button>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-md border border-green-200/50 dark:border-green-900/30">
                Published
              </span>
              <button
                onClick={() => handleSaveDraft('published')}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-650 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Save size={14} />
                Update Publish
              </button>
              <button
                onClick={() => handleSaveDraft('draft')}
                disabled={saving}
                className="px-3 py-1.5 text-xs text-warm-500 border border-warm-200 rounded-xl hover:bg-warm-50 dark:hover:bg-warm-800"
              >
                Revert to Draft
              </button>
            </>
          )}

          <button
            onClick={() => setShowOracle(!showOracle)}
            className={`p-2 rounded-xl border transition-colors ${
              showOracle
                ? 'bg-red-50 dark:bg-red-950/20 text-red-650 border-red-200 dark:border-red-900/30'
                : 'bg-white dark:bg-warm-850 text-warm-500 border-warm-250 dark:border-warm-750 hover:bg-warm-50'
            }`}
            title="Toggle Oracle Sidebar"
          >
            <Sparkles size={16} />
          </button>
        </div>
      </header>

      {/* Editor & Sidebar Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Main Editor Panel */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex justify-center bg-warm-50 dark:bg-warm-900">
          <div className="max-w-2xl w-full flex flex-col h-full space-y-6">
            
            {/* Title field */}
            <input
              type="text"
              placeholder="Chapter Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-serif font-bold bg-transparent border-0 border-b border-transparent focus:border-warm-250 dark:focus:border-warm-750 focus:ring-0 px-0 pb-2 text-warm-900 dark:text-white"
            />

            {/* Content field */}
            <textarea
              placeholder="Start writing your masterpiece here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 min-h-[500px] text-lg font-serif bg-transparent border-0 focus:ring-0 px-0 text-warm-800 dark:text-warm-100 placeholder-warm-400 resize-none font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* Right Side: Collapsible Oracle Assistant Sidebar */}
        {showOracle && (
          <aside className="w-80 sm:w-96 border-l border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-850 flex flex-col justify-between shadow-lg animate-slide-left z-20">
            
            {/* Sidebar Title */}
            <div className="p-4 border-b border-warm-100 dark:border-warm-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-650 dark:text-red-400">
                <Sparkles size={16} />
                <h3 className="font-serif font-bold text-sm text-warm-900 dark:text-white">Oracle AI Partner</h3>
              </div>
              <span className="text-[10px] font-bold text-warm-400 bg-warm-50 dark:bg-warm-800 px-2 py-0.5 rounded-full border border-warm-200/50 dark:border-warm-750">
                Collaborative
              </span>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] text-warm-450 mb-1">
                    {msg.role === 'user' ? 'Author' : 'Oracle'}
                  </span>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] font-sans whitespace-pre-line shadow-sm border ${
                      msg.role === 'user'
                        ? 'bg-red-650 text-white border-red-600'
                        : 'bg-warm-50 dark:bg-warm-800 text-warm-800 dark:text-warm-100 border-warm-100 dark:border-warm-750'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {oracleLoading && (
                <div className="flex flex-col items-start animate-pulse">
                  <span className="text-[9px] text-warm-450 mb-1">Oracle</span>
                  <div className="p-3 bg-warm-50 dark:bg-warm-800 text-warm-450 border border-warm-100 dark:border-warm-750 rounded-2xl text-xs font-semibold">
                    Oracle is meditating on your draft...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts & Input */}
            <div className="p-3 border-t border-warm-100 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-900/10 space-y-3">
              {/* Preset Quick Actions */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => triggerBrainstorm('outline')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:border-red-200 hover:text-red-650 transition-colors text-[10px] font-semibold text-warm-650 dark:text-warm-350"
                >
                  💡 Next Plot Beats
                </button>
                <button
                  onClick={() => triggerBrainstorm('pacing')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:border-red-200 hover:text-red-650 transition-colors text-[10px] font-semibold text-warm-650 dark:text-warm-350"
                >
                  ⏱️ Check Pacing
                </button>
                <button
                  onClick={() => triggerBrainstorm('inconsistencies')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:border-red-200 hover:text-red-650 transition-colors text-[10px] font-semibold text-warm-650 dark:text-warm-350"
                >
                  🔍 Find Inconsistencies
                </button>
              </div>

              {/* Text Input Row */}
              <div className="flex gap-2">
                <textarea
                  placeholder="Ask the Oracle a question about your characters or scene..."
                  rows={2}
                  value={oracleInput}
                  onChange={(e) => setOracleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendToOracle();
                    }
                  }}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-warm-200 dark:border-warm-750 bg-white dark:bg-warm-800 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 dark:text-white resize-none"
                />
                <button
                  onClick={() => handleSendToOracle()}
                  disabled={oracleLoading || !oracleInput.trim()}
                  className="p-3 bg-red-650 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow-md self-end transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

          </aside>
        )}

      </div>
    </div>
  );
}
