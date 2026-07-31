const ELEVENLABS_API_KEY = 'sk_616a104d4c1e1fac4c0743f4e5464b9378660459cbc90507';

export interface ElevenLabsVoice {
  id: string;
  voiceId: string;
  name: string;
  category: 'Narrator' | 'Heroic' | 'Mystic' | 'Soft' | 'Dark' | 'Vibrant';
  description: string;
  gender: 'Female' | 'Male' | 'Neutral';
  sampleText: string;
}

export const ELEVENLABS_VOICE_ROSTER: ElevenLabsVoice[] = [
  {
    id: 'rachel',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    name: 'Aurelia — Warm Narrator (ElevenLabs)',
    category: 'Narrator',
    description: 'Ultra-realistic, warm, steady, and immersive female voice ideal for epic web novels.',
    gender: 'Female',
    sampleText: 'Deep within the mountains of Maison Verity, ancient legends whisper of forgotten magic.'
  },
  {
    id: 'antoni',
    voiceId: 'ErXwobaYiN019PkySvjV',
    name: 'Kael — Heroic Lead (ElevenLabs)',
    category: 'Heroic',
    description: 'Resonant, confident male voice suited for protagonists and commanders.',
    gender: 'Male',
    sampleText: 'Stand firm! We push forward together, no matter the cost.'
  },
  {
    id: 'bella',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Seraphina — Arcane Mystic (ElevenLabs)',
    category: 'Mystic',
    description: 'Enigmatic, soft, and poetic cadence for sorcerers and ancient scholars.',
    gender: 'Female',
    sampleText: 'Listen closely... the stars do not lie, though few know how to decipher their light.'
  },
  {
    id: 'josh',
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Malakor — Shadow Sovereign (ElevenLabs)',
    category: 'Dark',
    description: 'Deep, commanding male voice for dark lords, villains, and mysterious identities.',
    gender: 'Male',
    sampleText: 'You enter my domain uninvited. Speak your last words before the shadows claim you.'
  },
  {
    id: 'elli',
    voiceId: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Zephyr — Playful Companion (ElevenLabs)',
    category: 'Vibrant',
    description: 'Upbeat, energetic, and expressive voice perfect for lively roleplay companions.',
    gender: 'Female',
    sampleText: 'Hey there! Ready for our next wild adventure? Let us get moving!'
  }
];

export async function generateElevenLabsAudio(text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM'): Promise<string> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  // Clean text of markdown formatting (*actions*, quotes) for natural narration
  const cleanText = text
    .replace(/\*.*?\*/g, '') // remove action tags for voice
    .replace(/[#_*`~]/g, '')
    .trim() || text;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text: cleanText,
      model_id: 'eleven_multilingual_v2', // Ultra-HD Human Emotion Model
      voice_settings: {
        stability: 0.35, // Lower stability = more expressive & human-like pitch variation
        similarity_boost: 0.85,
        style: 0.45, // High emotion & performance style
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[ElevenLabs API Diagnostic Error]:', response.status, errText);
    throw new Error(`ElevenLabs API error (${response.status}): ${errText}`);
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}
