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
        <div className="rounded-3xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-850 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-6 animate-fade-in">
          <div className="relative w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary-500/15 via-purple-500/10 to-indigo-500/10 flex items-center justify-center border border-primary-200 dark:border-primary-800/40 shadow-inner">
            <span className="text-4xl">🎙️</span>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-black border-2 border-white dark:border-warm-850">
              LIVE
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-extrabold text-warm-900 dark:text-white">
              No Active Voice Stages
            </h2>
            <p className="text-sm text-warm-500 dark:text-warm-400 leading-relaxed max-w-sm mx-auto font-medium">
              Host live story table-reads, AI roleplay listening lounges, or creator Q&amp;A sessions in real time.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            Start First Voice Stage
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
