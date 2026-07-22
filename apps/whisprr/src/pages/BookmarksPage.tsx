import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { WhisperCard } from '../components/feed/WhisperCard';
import type { Whisper, Profile, Reaction } from '../types';

type WhisperWithRelations = Whisper & {
  profiles: Profile;
  reactions: Reaction[];
  comment_count: number;
};

export default function BookmarksPage() {
  const { user } = useAuth();
  const [whispers, setWhispers] = useState<WhisperWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError(null);

      // Fetch bookmarks and the associated whispers
      const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select(`
          created_at,
          whispers (
            *,
            profiles:user_id(id, user_id, display_name, username, photo_url, bio, badges),
            reactions(id, whisper_id, user_id, type, created_at),
            bookmarks(user_id)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        // Extract whispers
        const whisperItems = data
          .map((b: any) => b.whispers)
          .filter(Boolean);
          
        const whisperIds = whisperItems.map((w: any) => w.id);

        // Fetch comment counts
        const { data: commentData } = await supabase
          .from('comments')
          .select('whisper_id')
          .in('whisper_id', whisperIds);

        const countMap = new Map<string, number>();
        if (commentData) {
          commentData.forEach(c => {
            countMap.set(c.whisper_id, (countMap.get(c.whisper_id) || 0) + 1);
          });
        }

        const result: WhisperWithRelations[] = whisperItems.map((w: any) => ({
          ...w,
          profiles: w.profiles,
          reactions: w.reactions || [],
          comment_count: countMap.get(w.id) || 0,
        }));

        setWhispers(result);
      } else {
        setWhispers([]);
      }
    } catch (err) {
      console.error('Error loading bookmarks:', err);
      setError('Failed to load bookmarks.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user, loadBookmarks]);

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-12 px-4 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-warm-900 dark:text-warm-50 mb-2">
            <Bookmark size={28} className="fill-current text-primary-500" />
            <h1 className="text-3xl font-serif">Bookmarks</h1>
          </div>
          <p className="text-warm-500 dark:text-warm-400">
            A private collection of the content you've saved.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : whispers.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {whispers.map(whisper => (
                <WhisperCard
                  key={whisper.id}
                  whisper={whisper}
                  onWhisperDeleted={loadBookmarks}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 px-6 bg-white dark:bg-warm-800 rounded-3xl border border-warm-200 dark:border-warm-700 shadow-sm">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
              <Bookmark size={32} />
            </div>
            <h3 className="text-xl font-serif text-warm-900 dark:text-warm-50 mb-2">No bookmarks yet</h3>
            <p className="text-warm-500 dark:text-warm-400 max-w-md mx-auto">
              When you see a post, story, or creation you want to revisit later, tap the bookmark icon to save it here.
            </p>
          </div>
        )}
    </div>
  );
}
