import { useState } from 'react';
import {
  X, BookOpen, Download, Share2, Sparkles, CheckCircle2,
  FileText, Copy, Printer, Globe, Rocket, Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface MessageItem {
  id: string;
  sender_id?: string;
  sender_type?: 'user' | 'bot' | 'system';
  content: string;
  created_at: string;
  profiles?: any;
}

interface TranscriptsExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  characterAvatarUrl?: string;
  messages: MessageItem[];
  conversationTitle?: string;
}

export function TranscriptsExporterModal({
  isOpen,
  onClose,
  characterName,
  characterAvatarUrl,
  messages,
  conversationTitle = 'A Roleplay Tale'
}: TranscriptsExporterModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formatMode, setFormatMode] = useState<'prose' | 'transcript' | 'script'>('prose');
  const [novelTitle, setNovelTitle] = useState(`${conversationTitle} - The Chronicle of ${characterName}`);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedStoryId, setPublishedStoryId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper: Format message content based on mode
  const formatContent = (msg: MessageItem) => {
    const isUser = msg.sender_type === 'user' || msg.sender_id === user?.id;
    const sender = isUser ? 'You' : (msg.profiles?.display_name || characterName);

    if (formatMode === 'prose') {
      // Convert *action text* into narrative italicized prose and dialogue into quotes
      let text = msg.content;
      // Convert *text* to narrative prose
      text = text.replace(/\*(.*?)\*/g, (_, p1) => `\n\n*${p1.trim()}*\n\n`);
      return (
        <div key={msg.id} className="mb-4 text-warm-800 dark:text-warm-200 leading-relaxed font-serif text-sm sm:text-base">
          <span className="font-bold text-xs uppercase text-warm-500 block mb-1">{sender}</span>
          <div className="pl-3 border-l-2 border-warm-200 dark:border-warm-750">
            {text}
          </div>
        </div>
      );
    }

    if (formatMode === 'script') {
      return (
        <div key={msg.id} className="mb-3 text-xs sm:text-sm font-mono text-warm-800 dark:text-warm-200">
          <span className="font-bold text-red-500 uppercase">{sender.toUpperCase()}:</span> {msg.content}
        </div>
      );
    }

    // Default Transcript Mode
    return (
      <div key={msg.id} className="mb-4 flex gap-3 text-xs sm:text-sm">
        <span className="font-bold text-warm-500 shrink-0">{sender}:</span>
        <span className="text-warm-800 dark:text-warm-200">{msg.content}</span>
      </div>
    );
  };

  // Generate plain text / markdown export string
  const getFullMarkdownText = () => {
    let out = `# ${novelTitle}\n\n`;
    out += `*A novelized roleplay transcript between ${user?.email || 'User'} and ${characterName}*\n\n---\n\n`;

    messages.forEach((msg) => {
      const sender = msg.sender_type === 'user' ? 'User' : characterName;
      if (formatMode === 'prose') {
        out += `### ${sender}\n${msg.content}\n\n`;
      } else if (formatMode === 'script') {
        out += `**${sender.toUpperCase()}**: ${msg.content}\n\n`;
      } else {
        out += `**${sender}**: ${msg.content}\n\n`;
      }
    });
    return out;
  };

  // Action: Copy Markdown
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(getFullMarkdownText());
    showToast('📋 Novel transcript copied to clipboard as Markdown!', 'success');
  };

  // Action: Publish directly to CHIMERA Stories Mode
  const handlePublishToStories = async () => {
    if (!user) {
      showToast('Please sign in to publish stories!', 'error');
      return;
    }

    try {
      setIsPublishing(true);

      // 1. Insert story into 'stories' table
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title: novelTitle,
          summary: `An epic novelized roleplay chronicle with ${characterName}. Generated from CHIMERA Roleplay Studio.`,
          genre: 'Fantasy',
          visibility: 'public',
          cover_url: characterAvatarUrl || null,
        })
        .select()
        .single();

      if (storyError) throw storyError;

      // 2. Insert Chapter 1 into 'story_chapters' table
      const { error: chapterError } = await supabase
        .from('story_chapters')
        .insert({
          story_id: story.id,
          chapter_number: 1,
          title: `Chapter 1: The Gathering at ${characterName}`,
          content: getFullMarkdownText(),
        });

      if (chapterError) throw chapterError;

      setPublishedStoryId(story.id);
      showToast('🚀 Novel successfully published to CHIMERA Stories!', 'success');
    } catch (err: any) {
      console.error('Error publishing story:', err);
      showToast(err.message || 'Failed to publish story to CHIMERA Stories.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-white dark:bg-warm-900 rounded-3xl shadow-2xl border border-warm-200 dark:border-warm-800 overflow-hidden relative flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-red-600 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <BookOpen size={28} className="text-amber-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold">Roleplay Web Novel Studio</h2>
              <p className="text-xs text-purple-100 mt-0.5">Convert your roleplay chat into a published Web Novel or book transcript</p>
            </div>
          </div>
        </div>

        {/* Control Bar & Formatting Options */}
        <div className="p-4 bg-warm-50 dark:bg-warm-950 border-b border-warm-200 dark:border-warm-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          
          {/* Format Selector */}
          <div className="flex items-center gap-1 bg-warm-200/60 dark:bg-warm-800 p-1 rounded-xl">
            <button
              onClick={() => setFormatMode('prose')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                formatMode === 'prose'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
              }`}
            >
              📖 Prose Novel
            </button>
            <button
              onClick={() => setFormatMode('script')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                formatMode === 'script'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
              }`}
            >
              🎭 Script Mode
            </button>
            <button
              onClick={() => setFormatMode('transcript')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                formatMode === 'transcript'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
              }`}
            >
              💬 Raw Transcript
            </button>
          </div>

          {/* Title Editor */}
          <input
            type="text"
            value={novelTitle}
            onChange={(e) => setNovelTitle(e.target.value)}
            className="flex-1 bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-750 rounded-xl px-3 py-1.5 text-xs font-serif font-bold text-warm-900 dark:text-white focus:outline-none focus:border-purple-500"
            placeholder="Novel Title..."
          />
        </div>

        {/* Book Preview Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-warm-100/50 dark:bg-warm-950/50 space-y-6">
          <div className="max-w-2xl mx-auto bg-white dark:bg-warm-900 p-6 sm:p-10 rounded-2xl shadow-md border border-warm-200 dark:border-warm-800 space-y-6">
            
            {/* Book Cover Header */}
            <div className="text-center pb-6 border-b border-warm-200 dark:border-warm-800 space-y-2">
              {characterAvatarUrl && (
                <img
                  src={characterAvatarUrl}
                  alt={characterName}
                  className="w-20 h-20 rounded-2xl mx-auto object-cover shadow-lg border-2 border-purple-500/30"
                />
              )}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-warm-900 dark:text-white">{novelTitle}</h1>
              <p className="text-xs text-warm-500 font-serif italic">
                Co-authored by {user?.email?.split('@')[0] || 'Roleplayer'} &amp; {characterName}
              </p>
            </div>

            {/* Render Chapter Messages */}
            <div className="space-y-4">
              {messages.length > 0 ? (
                messages.map(formatContent)
              ) : (
                <p className="text-xs text-center text-warm-400 py-8">No messages in conversation to format yet.</p>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-warm-50 dark:bg-warm-950 border-t border-warm-200 dark:border-warm-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <button
            onClick={handleCopyMarkdown}
            className="px-4 py-2 rounded-xl bg-warm-200 dark:bg-warm-800 hover:bg-warm-300 dark:hover:bg-warm-750 text-warm-800 dark:text-warm-200 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Copy size={15} />
            <span>Copy Markdown</span>
          </button>

          {publishedStoryId ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 size={16} /> Published to Stories!
              </span>
              <button
                onClick={() => window.open(`/stories/${publishedStoryId}`, '_blank')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Eye size={15} />
                <span>View Story</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handlePublishToStories}
              disabled={isPublishing || messages.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Rocket size={16} />
              <span>{isPublishing ? 'Publishing Story...' : '🚀 Publish to CHIMERA Stories Mode'}</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
