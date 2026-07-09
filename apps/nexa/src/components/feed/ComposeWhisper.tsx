import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Smile } from 'lucide-react';
import { MOODS, type Mood } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useInterests } from '../../contexts/InterestContext';
import { supabase } from '../../lib/supabase';
import { EmojiPicker } from '../common/EmojiPicker';

interface ComposeWhisperProps {
  onClose: () => void;
  onWhisperCreated?: () => void;
  communityId?: string;
}

const CHAR_LIMIT = 5000;
const WARN_THRESHOLD = 0.8;
const DANGER_THRESHOLD = 0.95;

export function ComposeWhisper({
  onClose,
  onWhisperCreated,
  communityId,
}: ComposeWhisperProps) {
  const { user } = useAuth();
  const { track } = useInterests();
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > CHAR_LIMIT;
  const charRatio = charCount / CHAR_LIMIT;
  const isWarning = charRatio >= WARN_THRESHOLD && charRatio < DANGER_THRESHOLD;
  const isDanger = charRatio >= DANGER_THRESHOLD;

  // Auto-expand textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 384)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      // Restore cursor position after emoji insertion
      requestAnimationFrame(() => {
        el.selectionStart = start + emoji.length;
        el.selectionEnd = start + emoji.length;
        el.focus();
      });
    } else {
      setContent(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isOverLimit || charCount === 0) return;

    setIsPosting(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('whispers').insert({
        content: content.trim(),
        mood: selectedMood || null,
        community_id: communityId || null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      track({
        eventType: 'post',
        targetType: 'whisper',
        mood: selectedMood || undefined,
        communityId: communityId || undefined,
        interests: selectedMood ? [selectedMood] : undefined,
      });

      setContent('');
      setSelectedMood(null);
      onWhisperCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post whisper');
    } finally {
      setIsPosting(false);
    }
  };

  const counterColor = isOverLimit
    ? 'text-error-600 dark:text-error-400'
    : isDanger
    ? 'text-warning-600 dark:text-warning-400'
    : isWarning
    ? 'text-warm-600 dark:text-warm-400'
    : 'text-warm-400 dark:text-warm-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 sm:items-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-lg mx-auto bg-white dark:bg-warm-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-scale-in border border-warm-100 dark:border-warm-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title text-xl">Share your thought</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 rounded-2xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Textarea */}
          <div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what's on your mind…"
              className="input-field font-serif leading-relaxed resize-none overflow-y-auto"
              style={{ minHeight: '8rem', maxHeight: '24rem', height: 'auto' }}
              disabled={isPosting}
            />
            {/* Counter + Emoji button row */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(p => !p)}
                  className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors"
                  aria-label="Insert emoji"
                >
                  <Smile size={18} className="text-warm-400 hover:text-primary-500 transition-colors" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {isOverLimit && (
                  <span className="text-xs text-error-600 dark:text-error-400 font-medium">
                    {charCount - CHAR_LIMIT} over limit
                  </span>
                )}
                <span className={`text-xs font-medium tabular-nums ${counterColor}`}>
                  {charCount.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-2 animate-scale-in">
                <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
              </div>
            )}
          </div>

          {/* Mood Selector — pill chips, no dropdown */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2.5">
              How are you feeling? <span className="text-warm-400 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
                  disabled={isPosting}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border ${
                    selectedMood === mood
                      ? 'bg-primary-500 text-white border-primary-500 shadow-warm'
                      : 'bg-warm-50 dark:bg-warm-700 text-warm-700 dark:text-warm-200 border-warm-200 dark:border-warm-600 hover:border-primary-300 dark:hover:border-primary-600'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPosting}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPosting || charCount === 0 || isOverLimit}
              className="btn-primary flex-1"
            >
              {isPosting ? 'Posting…' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
