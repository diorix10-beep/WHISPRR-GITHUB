import { useState, useEffect } from 'react';

export type ChatLayout = 'classic' | 'modern';
export type ChatStyleColor = 'default' | 'crimson' | 'midnight' | 'royal';

interface ChatAesthetics {
  wallpaperUrl: string | null;
  layoutStyle: ChatLayout;
  chatStyle: ChatStyleColor;
}

const DEFAULT_AESTHETICS: ChatAesthetics = {
  wallpaperUrl: null,
  layoutStyle: 'modern',
  chatStyle: 'default'
};

export function useChatAesthetics(conversationId: string | undefined) {
  const [aesthetics, setAesthetics] = useState<ChatAesthetics>(DEFAULT_AESTHETICS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (!conversationId) return;

    try {
      const stored = localStorage.getItem(`chat_aesthetics_${conversationId}`);
      if (stored) {
        setAesthetics(JSON.parse(stored));
      } else {
        setAesthetics(DEFAULT_AESTHETICS);
      }
    } catch (error) {
      console.error('Failed to load chat aesthetics:', error);
    }
    setIsLoaded(true);
  }, [conversationId]);

  // Save to localStorage on change
  const updateAesthetics = (updates: Partial<ChatAesthetics>) => {
    if (!conversationId) return;

    setAesthetics(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(`chat_aesthetics_${conversationId}`, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save chat aesthetics:', error);
      }
      return next;
    });
  };

  return {
    ...aesthetics,
    isLoaded,
    setWallpaper: (url: string | null) => updateAesthetics({ wallpaperUrl: url }),
    setLayout: (layout: ChatLayout) => updateAesthetics({ layoutStyle: layout }),
    setChatStyle: (style: ChatStyleColor) => updateAesthetics({ chatStyle: style })
  };
}
