import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import type { VoiceRoom, Profile } from '../types';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';
import { CreateVoiceRoomModal } from '../components/voicerooms/CreateVoiceRoomModal';
import { VoiceRoomDetail } from '../components/voicerooms/VoiceRoomDetail';

interface VoiceRoomWithHost extends VoiceRoom {
  host_profile?: Profile;
  community?: { name: string };
}

export default function VoiceRoomsPage() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [voiceRooms, setVoiceRooms] = useState<VoiceRoomWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // If roomId is provided, show the voice room detail view
  if (roomId) {
    return (
      <VoiceRoomDetail
        roomId={roomId}
        onBack={() => navigate('/voice-rooms')}
      />
    );
  }

  // Fetch voice rooms
  const fetchVoiceRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_rooms')
        .select('*, profiles:host_id(*), community:community_id(*)')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVoiceRooms((data || []) as VoiceRoomWithHost[]);
    } catch (error) {
      console.error('Error fetching voice rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoiceRooms();

    // Subscribe to real-time voice room updates
    const channel = supabase
      .channel('voice-rooms-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'voice_rooms',
      }, () => {
        fetchVoiceRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header with Create Room Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Voice Rooms</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 py-2 px-4"
        >
          <Plus size={18} />
          Create
        </button>
      </div>

      {/* Voice Rooms List */}
      {voiceRooms.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🎙️</div>
          <p className="text-warm-600 mb-2">No active voice rooms</p>
          <p className="text-sm text-warm-500">
            Create a voice room to start connecting with others
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary mt-4 py-2 px-6"
          >
            Create Room
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {voiceRooms.map(room => (
            <button
              key={room.id}
              onClick={() => navigate(`/voice-rooms/${room.id}`)}
              className="card w-full text-left hover:shadow-warm transition-all duration-200"
            >
              <div className="space-y-3">
                {/* Room Name and Participant Count */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-warm-900 dark:text-warm-100 text-lg">
                      {room.name}
                    </h3>
                    <p className="text-sm text-warm-600 dark:text-warm-400">
                      {room.participant_count} {room.participant_count === 1 ? 'participant' : 'participants'}
                    </p>
                  </div>
                  <div className="text-3xl">🎤</div>
                </div>

                {/* Host Info */}
                {room.host_profile && (
                  <div className="flex items-center gap-2">
                    <Avatar
                      photoUrl={room.host_profile.photo_url}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-warm-900 dark:text-warm-100">
                        Hosted by {room.host_profile.display_name}
                      </p>
                      <p className="text-xs text-warm-500">@{room.host_profile.username}</p>
                    </div>
                  </div>
                )}

                {/* Community Badge */}
                {room.community && (
                  <div className="inline-block">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
                      {room.community.name}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Voice Room Modal */}
      {showCreateModal && (
        <CreateVoiceRoomModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(roomId) => {
            setShowCreateModal(false);
            navigate(`/voice-rooms/${roomId}`);
          }}
        />
      )}
    </div>
  );
}
