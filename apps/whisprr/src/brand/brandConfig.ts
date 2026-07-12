export type ProductId = 'whisprr' | 'chimera';

export interface BrandConfig {
  id: ProductId;
  name: string;
  shortName: string;
  tagline: string;
  heroTagline: string;
  description: string;
  themeColor: string;
  domain: string;
  ogImage: string;
  loadingText: string;
  authSubtitle: string;
  onboardingWelcome: string;
  onboardingSubtitle: string;
  footerText: string;
  supportEmail: string;
  showWhisprrOption: boolean;
}

const WHISPRR: BrandConfig = {
  id: 'whisprr',
  name: 'WHISPRR',
  shortName: 'WHISPRR',
  tagline: 'Where connections feel real',
  heroTagline: 'Where connections feel real.',
  description: 'A social platform where connections feel real. Share whispers, join communities, and discover people who resonate with you.',
  themeColor: '#D4736E',
  domain: 'whisprr.xyz',
  ogImage: 'https://whisprr.xyz/pwa-512x512.png',
  loadingText: 'Loading...',
  authSubtitle: 'Where connections feel real',
  onboardingWelcome: 'Welcome to WHISPRR',
  onboardingSubtitle: "Let's set up your profile. Start with your name and username.",
  footerText: 'Join a thoughtful network built for authentic connections.',
  supportEmail: 'help@whisprr.xyz',
  showWhisprrOption: false,
};

const CHIMERA: BrandConfig = {
  id: 'chimera',
  name: 'CHIMER.AI',
  shortName: 'CHIMERA',
  tagline: 'Where conversations become worlds.',
  heroTagline: 'Every conversation becomes a story worth remembering.',
  description: 'CHIMERA is where people create, connect, roleplay, and enjoy AI together.',
  themeColor: '#C96059',
  domain: 'chimera.whisprr.xyz',
  ogImage: 'https://chimera.whisprr.xyz/pwa-512x512.png',
  loadingText: 'Entering CHIMERA...',
  authSubtitle: 'Where conversations become worlds.',
  onboardingWelcome: 'Welcome to CHIMERA',
  onboardingSubtitle: "Let's set up your profile. Start with your name and username.",
  footerText: 'Create, connect, and explore worlds with AI.',
  supportEmail: 'help@chimera.whisprr.xyz',
  showWhisprrOption: true,
};

function detectProduct(): ProductId {
  if (typeof window === 'undefined') return 'whisprr';
  const host = window.location.hostname;
  if (host.startsWith('chimera.') || host.includes('chimera')) return 'chimera';
  return 'whisprr';
}

export const brand: BrandConfig = detectProduct() === 'chimera' ? CHIMERA : WHISPRR;

export function getBrand(): BrandConfig {
  return brand;
}
