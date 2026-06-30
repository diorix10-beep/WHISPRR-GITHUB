// ============================================================
// ORACLE VERITY — LANGUAGE DETECTOR
// ============================================================

const FRENCH_PATTERNS = [
  /\b(bonjour|salut|bonsoir|merci|s'il vous plaît|s'il te plaît|oui|non|je|tu|nous|vous|ils|elles|le|la|les|un|une|des|du|au|aux|et|ou|mais|donc|or|ni|car)\b/i,
  /\b(comment|pourquoi|quand|où|qui|quoi|quel|quelle|quels|quelles)\b/i,
  /\b(est|sont|avoir|être|faire|dire|aller|voir|savoir|pouvoir|vouloir|venir)\b/i,
  /[àâäéèêëîïôùûüÿœæç]/i,
];

const ENGLISH_PATTERNS = [
  /\b(the|a|an|is|are|was|were|have|has|had|do|does|did|will|would|could|should|can|may|might)\b/i,
  /\b(I|you|he|she|it|we|they|me|him|her|us|them|my|your|his|its|our|their)\b/i,
  /\b(and|or|but|so|because|if|when|where|what|who|how|why|which)\b/i,
];

export function detectLanguage(text: string): 'en' | 'fr' {
  if (!text || text.trim().length < 2) return 'en';

  let frScore = 0;
  let enScore = 0;

  for (const pattern of FRENCH_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) frScore += matches.length;
  }

  for (const pattern of ENGLISH_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) enScore += matches.length;
  }

  // French wins on tie because accent chars are strong signals
  return frScore >= enScore ? 'fr' : 'en';
}

export function getTimeGreeting(lang: 'en' | 'fr'): string {
  const hour = new Date().getHours();
  if (lang === 'fr') {
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getTimeOfDayMode(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
