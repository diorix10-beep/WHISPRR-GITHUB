export interface CharacterVoice {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  tone: string;
  lang: string;
  pitch: number;
  rate: number;
}

export const PRESET_CHARACTER_VOICES: CharacterVoice[] = [
  { id: 'voice_gentle_female', name: 'Aria (Gentle & Warm)', gender: 'female', tone: 'Affectionate, soft-spoken, comforting', lang: 'en-US', pitch: 1.1, rate: 0.95 },
  { id: 'voice_mystic_female', name: 'Elysia (Mystical Arcane)', gender: 'female', tone: 'Enchanting, wise, atmospheric', lang: 'en-US', pitch: 1.0, rate: 0.9 },
  { id: 'voice_deep_male', name: 'Kaelen (Deep & Noble)', gender: 'male', tone: 'Resonant, authoritative, calm', lang: 'en-US', pitch: 0.8, rate: 0.95 },
  { id: 'voice_playful_male', name: 'Zephyr (Energetic Adventurer)', gender: 'male', tone: 'Playful, confident, expressive', lang: 'en-US', pitch: 1.0, rate: 1.05 },
  { id: 'voice_soft_whisper', name: 'Whisper (Velvet Shadow)', gender: 'neutral', tone: 'Mysterious, quiet, intimate', lang: 'en-US', pitch: 0.95, rate: 0.85 },
];

class VoiceEngine {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getAvailableSystemVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  public speak(text: string, voiceId?: string, onEnd?: () => void): void {
    if (!this.isSupported()) return;

    this.stop();

    // Clean markdown stars/asterisks (roleplay actions like *smiles*) before reading
    const spokenText = text.replace(/\*.*?\*/g, '').trim() || text;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    const preset = PRESET_CHARACTER_VOICES.find(v => v.id === voiceId) || PRESET_CHARACTER_VOICES[0];

    utterance.pitch = preset.pitch;
    utterance.rate = preset.rate;

    // Match browser system voices if available
    const systemVoices = this.getAvailableSystemVoices();
    if (systemVoices.length > 0) {
      const matched = systemVoices.find(v => 
        (preset.gender === 'female' && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Zira'))) ||
        (preset.gender === 'male' && (v.name.includes('Male') || v.name.includes('Alex') || v.name.includes('David') || v.name.includes('Daniel'))) ||
        v.lang.startsWith(preset.lang.slice(0, 2))
      ) || systemVoices[0];
      
      utterance.voice = matched;
    }

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.isSpeakingState = true;
    window.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (this.isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    this.isSpeakingState = false;
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }
}

export const voiceEngine = new VoiceEngine();
