// CHIMERA Multilingual Translation Engine

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
];

export const I18N_DICTIONARY: Record<string, Record<string, string>> = {
  fr: {
    'Discover': 'Découvrir',
    'Characters': 'Personnages',
    'Chats': 'Discussions',
    'Personas': 'Personas',
    'Studio': 'Studio',
    'Home': 'Accueil',
    'Stories': 'Histoires',
    'Worlds': 'Mondes',
    'Lorebooks': 'Grimoires',
    'Writer': 'Écrivain',
    'SHARDS Hub': 'Réserve de SHARDS',
    'Create': 'Créer',
    'Search': 'Rechercher',
    'Roleplay': 'Jeu de Rôle',
    'Story': 'Histoire',
    'Roleplay Mode': 'Mode Jeu de Rôle',
    'Storytelling Mode': 'Mode Narration',
    'Sign Out': 'Se Déconnecter',
    'Profile': 'Profil',
    'Settings': 'Paramètres',
    'Theme': 'Thème',
    'SHARDS Reserve': 'Réserve de SHARDS',
    'Creative Energy': 'Énergie Créative',
  },
  es: {
    'Discover': 'Descubrir',
    'Characters': 'Personajes',
    'Chats': 'Chats',
    'Personas': 'Personajes',
    'Studio': 'Estudio',
    'Home': 'Inicio',
    'Stories': 'Historias',
    'Worlds': 'Mundos',
    'Lorebooks': 'Grimorios',
    'Writer': 'Escritor',
  }
};

export function getUITranslation(key: string, langCode: string): string {
  if (langCode === 'en' || !langCode) return key;
  return I18N_DICTIONARY[langCode]?.[key] || key;
}

export async function translateText(text: string, targetLangCode: string): Promise<string> {
  if (!text || targetLangCode === 'en') return text;

  // Check dictionary first
  if (I18N_DICTIONARY[targetLangCode]?.[text]) {
    return I18N_DICTIONARY[targetLangCode][text];
  }

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=autodetect|${targetLangCode}`
    );
    const json = await res.json();
    if (json?.responseData?.translatedText) {
      return json.responseData.translatedText;
    }
  } catch (err) {
    console.error('Translation error:', err);
  }

  return text;
}
