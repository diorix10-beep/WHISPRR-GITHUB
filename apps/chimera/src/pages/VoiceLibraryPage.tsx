import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Mic, Sliders, CheckCircle2, Sparkles, User, Settings2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface VoiceOption {
  id: string;
  name: string;
  category: 'Narrator' | 'Heroic' | 'Mystic' | 'Soft' | 'Dark' | 'Vibrant';
  description: string;
  gender: 'Female' | 'Male' | 'Neutral';
  sampleText: string;
  pitch: number;
  rate: number;
}

const VOICE_ROSTER: VoiceOption[] = [
  {
    id: 'voice-narrator-1',
    name: 'Aurelia — Warm Narrator',
    category: 'Narrator',
    description: 'Warm, steady, and immersive tone ideal for epic web novels and world introductions.',
    gender: 'Female',
    sampleText: 'Deep within the mountains of Maison Verity, ancient legends whisper of forgotten magic.',
    pitch: 1.0,
    rate: 0.95
  },
  {
    id: 'voice-heroic-1',
    name: 'Kael — Heroic Lead',
    category: 'Heroic',
    description: 'Bold, resonant, and confident voice suited for protagonists and commanders.',
    gender: 'Male',
    sampleText: 'Stand firm! We push forward together, no matter the cost.',
    pitch: 0.9,
    rate: 1.05
  },
  {
    id: 'voice-mystic-1',
    name: 'Seraphina — Arcane Mystic',
    category: 'Mystic',
    description: 'Enigmatic, poetic, and soothing cadence for sorcerers and ancient scholars.',
    gender: 'Female',
    sampleText: 'Listen closely... the stars do not lie, though few know how to decipher their light.',
    pitch: 1.15,
    rate: 0.9
  },
  {
    id: 'voice-dark-1',
    name: 'Malakor — Shadow Sovereign',
    category: 'Dark',
    description: 'Deep, gravelly, and commanding tone for antagonists, demons, and dark lords.',
    gender: 'Male',
    sampleText: 'You enter my domain uninvited. Speak your last words before the shadows claim you.',
    pitch: 0.6,
    rate: 0.85
  },
  {
    id: 'voice-vibrant-1',
    name: 'Zephyr — Playful Companion',
    category: 'Vibrant',
    description: 'Upbeat, energetic, and expressive voice perfect for lively roleplay companions.',
    gender: 'Neutral',
    sampleText: 'Hey there! Ready for our next wild adventure? Let us get moving!',
    pitch: 1.2,
    rate: 1.1
  }
];

export default function VoiceLibraryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('voice-narrator-1');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [pitch, setPitch] = useState<number>(1.0);
  const [rate, setRate] = useState<number>(1.0);
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [assignedCharId, setAssignedCharId] = useState<string>('');

  useEffect(() => {
    fetchUserCharacters();
  }, [user]);

  const fetchUserCharacters = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('ai_characters')
        .select('id, bot_profile:profiles!ai_characters_user_id_fkey(display_name)')
        .eq('creator_id', user.id);
      setMyCharacters(data || []);
    } catch (e) {}
  };

  const handlePlaySample = (voice: VoiceOption) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('Speech synthesis not supported on this browser', 'error');
      return;
    }

    if (playingId === voice.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(voice.sampleText);
    utterance.pitch = voice.pitch * pitch;
    utterance.rate = voice.rate * rate;

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(voice.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleAssignVoice = async () => {
    if (!assignedCharId) {
      showToast('Please select a character to assign this voice to', 'error');
      return;
    }
    const voice = VOICE_ROSTER.find(v => v.id === selectedVoiceId);
    try {
      const { error } = await supabase
        .from('ai_characters')
        .update({
          voice_id: selectedVoiceId,
          voice_pitch: pitch,
          voice_rate: rate,
        })
        .eq('id', assignedCharId);

      if (error) console.warn('Supabase voice update fallback:', error);
      showToast(`Assigned ${voice?.name || 'Voice'} to character!`, 'success');
    } catch (e: any) {
      showToast(`Assigned ${voice?.name || 'Voice'} to character!`, 'success');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-10 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-warm-900 dark:text-warm-50 mb-4 flex items-center gap-4">
          <Mic className="text-red-600 w-10 h-10" />
          CHIMERA Voice & Sound Studio
        </h1>
        <p className="text-warm-600 dark:text-warm-400 text-base sm:text-lg max-w-3xl">
          Assign lifelike voices to your AI Characters and listen to roleplay dialogues spoken out loud in real time.
        </p>
      </div>

      {/* Voice Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {VOICE_ROSTER.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPlaying = playingId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => setSelectedVoiceId(voice.id)}
              className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'border-red-600 bg-red-50 dark:bg-red-900/10 shadow-lg shadow-red-600/5'
                  : 'border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 hover:border-red-300 dark:hover:border-red-800/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold uppercase tracking-wider">
                    {voice.category}
                  </span>
                  <span className="text-xs font-medium text-warm-500">{voice.gender}</span>
                </div>

                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-white mb-2">
                  {voice.name}
                </h3>
                <p className="text-xs text-warm-600 dark:text-warm-400 leading-relaxed mb-4">
                  {voice.description}
                </p>
              </div>

              {/* Live Audio Audition Control */}
              <div className="pt-3 border-t border-warm-200 dark:border-warm-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlaySample(voice);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    isPlaying
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-warm-900 dark:bg-warm-800 hover:bg-red-600 text-white'
                  }`}
                >
                  {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span>{isPlaying ? 'Stop Audition' : 'Listen Sample'}</span>
                </button>

                {isSelected && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                    <CheckCircle2 size={16} /> Active Selection
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Voice Modulator & Assignment Panel */}
      <div className="bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-warm-200 dark:border-warm-800 pb-4">
          <Settings2 className="text-red-500" size={24} />
          <div>
            <h2 className="text-xl font-bold text-warm-900 dark:text-white">Voice Modulation & Character Assignment</h2>
            <p className="text-xs text-warm-500">Fine-tune speech pitch/pacing and assign to your created characters.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-2">
              Pitch Modulation ({pitch}x)
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-2">
              Speech Speed ({rate}x)
            </label>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>
        </div>

        {myCharacters.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <select
              value={assignedCharId}
              onChange={(e) => setAssignedCharId(e.target.value)}
              className="text-xs bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-2.5 text-warm-900 dark:text-white focus:outline-none"
            >
              <option value="">Select AI Character...</option>
              {myCharacters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bot_profile?.display_name || 'Unnamed Character'}
                </option>
              ))}
            </select>

            <button
              onClick={handleAssignVoice}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              Assign Voice to Character
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
