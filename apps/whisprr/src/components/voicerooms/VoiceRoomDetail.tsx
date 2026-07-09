import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Mic, MicOff } from 'lucide-react';
import type { VoiceRoom, Profile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../common/Avatar';

interface VoiceRoomDetailProps {
  roomId: string;
  onBack: () => void;
}

interface VoiceRoomWithHost extends VoiceRoom {
  host_profile?: Profile;
}

export function VoiceRoomDetail({ roomId, onBack }: VoiceRoomDetailProps) {
  const { user } = useAuth();
  const [room, setRoom] = useState<VoiceRoomWithHost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('voice_rooms')
          .select('*, profiles:host_id(*)')
          .eq('id', roomId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Voice room not found');
          return;
        }

        setRoom(data as VoiceRoomWithHost);
      } catch (err) {
        console.error('Error fetching voice room:', err);
        setError('Failed to load voice room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();

    // Subscribe to real-time room updates
    const channel = supabase
      .channel(`voice-room-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'voice_rooms',
        filter: `id=eq.${roomId}`,
      }, (payload) => {
        setRoom(prev => prev ? { ...prev, ...payload.new } : null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleLeaveRoom = async () => {
    if (!user || !room) return;

    try {
      // Update participant count
      const newParticipantCount = Math.max(0, (room.participant_count || 1) - 1);
      const { error: updateError } = await supabase
        .from('voice_rooms')
        .update({ participant_count: newParticipantCount })
        .eq('id', roomId);

      if (updateError) throw updateError;

      onBack();
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-warm-900 z-40 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-warm-900 z-40 flex flex-col items-center justify-center">
        <p className="text-warm-600 dark:text-warm-400 mb-4">{error || 'Voice room not found'}</p>
        <button onClick={onBack} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const isHost = user?.id === room.host_id;
  const listenerCount = Math.max(0, (room.participant_count || 1) - 1);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-warm-900 dark:to-warm-800 z-40 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-warm-800/80 backdrop-blur-sm border-b border-warm-200 dark:border-warm-700 p-4">
        <button
          onClick={onBack}
          className="btn-ghost p-2 -ml-2 flex items-center gap-2"
        >
          <ArrowLeft size={24} />
          Back
        </button>
      </div>

      {/* Coming Soon Notice */}
      <div className="mx-4 mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          🎙️ Voice features coming soon! This is a preview of the voice room UI.
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        <div className="space-y-6">
          {/* Room Header */}
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-100 mb-2">
              {room.name}
            </h1>
            <p className="text-warm-600 dark:text-warm-400">
              {room.participant_count} {room.participant_count === 1 ? 'person' : 'people'} in room
            </p>
          </div>

          {/* Speaker Section (Host) */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100">
              🎤 Speaker
            </h2>
            <div className="card">
              <div className="flex items-center gap-4">
                {room.host_profile && (
                  <>
                    <Avatar
                      emoji={room.host_profile.avatar_emoji}
                      photoUrl={room.host_profile.photo_url}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-warm-900 dark:text-warm-100">
                        {room.host_profile.display_name}
                      </h3>
                      <p className="text-sm text-warm-600 dark:text-warm-400">
                        @{room.host_profile.username}
                      </p>
                      {isHost && (
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1">
                          Host
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Listeners Section */}
          {listenerCount > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100">
                👥 Listeners ({listenerCount})
              </h2>
              <div className="space-y-2">
                {Array.from({ length: listenerCount }).map((_, index) => (
                  <div key={index} className="card">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-300 to-accent-300 dark:from-primary-700 dark:to-accent-700 flex items-center justify-center text-2xl">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-warm-900 dark:text-warm-100">
                          Listener {index + 1}
                        </h3>
                        <p className="text-sm text-warm-600 dark:text-warm-400">
                          Listening
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State for Listeners */}
          {listenerCount === 0 && (
            <div className="card text-center py-8">
              <p className="text-warm-600 dark:text-warm-400">
                No other participants yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controls Footer */}
      <div className="sticky bottom-0 bg-white/80 dark:bg-warm-800/80 backdrop-blur-sm border-t border-warm-200 dark:border-warm-700 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium transition-all duration-200 ${
              isMuted
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            }`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button
            onClick={handleLeaveRoom}
            className="flex-1 btn-secondary"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
