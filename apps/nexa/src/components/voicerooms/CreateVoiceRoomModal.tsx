import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Community } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface CreateVoiceRoomModalProps {
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

export function CreateVoiceRoomModal({ onClose, onSuccess }: CreateVoiceRoomModalProps) {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCommunities, setFetchingCommunities] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's communities
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('communities')
          .select('*')
          .eq('owner_id', user.id);

        if (fetchError) throw fetchError;
        setCommunities(data || []);
      } catch (err) {
        console.error('Error fetching communities:', err);
      } finally {
        setFetchingCommunities(false);
      }
    };

    fetchCommunities();
  }, [user]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user || !roomName.trim()) {
      setError('Please enter a room name');
      return;
    }

    setLoading(true);

    try {
      const { data, error: insertError } = await supabase
        .from('voice_rooms')
        .insert({
          name: roomName.trim(),
          host_id: user.id,
          community_id: selectedCommunityId || null,
          active: true,
          participant_count: 1,
        })
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      if (data) {
        onSuccess(data.id);
      }
    } catch (err) {
      console.error('Error creating voice room:', err);
      setError('Failed to create voice room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-warm-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-warm-800 border-b border-warm-200 dark:border-warm-700 p-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-100">
            Create Voice Room
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost p-2"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleCreateRoom} className="p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Room Name Input */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              placeholder="e.g., Coffee Chat, Study Session"
              className="input-field"
              disabled={loading}
            />
          </div>

          {/* Community Selection */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              Linked Community (Optional)
            </label>
            {fetchingCommunities ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-primary-500" />
              </div>
            ) : communities.length === 0 ? (
              <p className="text-sm text-warm-500 italic">
                You don't have any communities yet
              </p>
            ) : (
              <select
                value={selectedCommunityId}
                onChange={e => setSelectedCommunityId(e.target.value)}
                className="input-field"
                disabled={loading}
              >
                <option value="">No community</option>
                {communities.map(community => (
                  <option key={community.id} value={community.id}>
                    {community.emoji} {community.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={loading || !roomName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
