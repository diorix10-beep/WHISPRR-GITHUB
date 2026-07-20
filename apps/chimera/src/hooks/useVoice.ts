import { useState, useEffect, useCallback, useRef } from 'react';

export function useVoice() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        if (!synthRef.current) return;
        const availableVoices = synthRef.current.getVoices();
        setVoices(availableVoices);
        
        // Try to pick a good default English voice
        if (!selectedVoice && availableVoices.length > 0) {
          const defaultVoice = 
            availableVoices.find(v => v.name.includes('Google US English')) ||
            availableVoices.find(v => v.name.includes('Samantha')) ||
            availableVoices.find(v => v.lang.startsWith('en-')) ||
            availableVoices[0];
            
          setSelectedVoice(defaultVoice || null);
        }
      };

      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }
  }, [selectedVoice]);

  const toggleVoice = useCallback(() => {
    setIsEnabled(prev => {
      const next = !prev;
      if (!next && synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (!isEnabled || !synthRef.current || !text) return;

    // Clean up text before speaking (remove markdown asterisks, etc)
    const cleanText = text
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/#/g, '')
      .replace(/\(OOC:.*?\)/gi, ''); // Don't speak OOC notes

    synthRef.current.cancel(); // Stop any current speech

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Adjust pitch/rate slightly for a more natural feel if desired
    utterance.pitch = 1.0;
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [isEnabled, selectedVoice]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isEnabled,
    isSpeaking,
    toggleVoice,
    speak,
    stop,
    voices,
    selectedVoice,
    setSelectedVoice
  };
}
