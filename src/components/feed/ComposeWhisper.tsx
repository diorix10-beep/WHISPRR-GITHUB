import { useState } from 'react';
import { X } from 'lucide-react';
import { MOODS, type Mood } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useInterests } from '../../contexts/InterestContext';
import { supabase } from '../../lib/supabase';

interface ComposeWhisperProps {
  onClose: () => void;
  onWhisperCreated?: () => void;
  communityId?: string;
}

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

  const charLimit = 500;
  const charCount = content.length;
  const isOverLimit = charCount > charLimit;

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

      // Track post interest
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 sm:items-center">
      <div className="w-full sm:max-w-md bg-white dark:bg-warm-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Share your thought</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-2xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Textarea */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what's on your mind..."
              className="input-field resize-none h-32 font-serif"
              disabled={isPosting}
            />
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-xs font-medium ${
                  isOverLimit
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-warm-400 dark:text-warm-500'
                }`}
              >
                {charCount}/{charLimit}
              </span>
              {isOverLimit && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  Character limit exceeded
                </span>
              )}
            </div>
          </div>

          {/* Mood Selector */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              How are you feeling?
            </label>
            <select
              value={selectedMood || ''}
              onChange={(e) => setSelectedMood((e.target.value as Mood) || null)}
              disabled={isPosting}
              className="input-field"
            >
              <option value="">No mood selected</option>
              {MOODS.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>

          {/* Mood Badge Preview */}
          {selectedMood && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-warm-600 dark:text-warm-400">Selected:</span>
              <span className="inline-flex rounded-full font-serif font-semibold px-3.5 py-1.5 text-sm bg-gradient-to-r from-primary-200 to-accent-200 text-primary-700 dark:from-primary-600 dark:to-accent-600 dark:text-warm-50">
                {selectedMood}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
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
              {isPosting ? 'Posting...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
