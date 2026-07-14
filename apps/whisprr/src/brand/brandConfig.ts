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
  tagline: 'The Home of Creators.',
  heroTagline: 'The Home of Creators.',
  description: 'The social platform where creators connect, share their work, join communities, and build together.',
  themeColor: '#a855f7',
  domain: 'whisprr.xyz',
  ogImage: 'https://whisprr.xyz/pwa-512x512.png',
  loadingText: 'Loading...',
  authSubtitle: 'Where creators belong.',
  onboardingWelcome: 'Welcome to WHISPRR',
  onboardingSubtitle: "Let's set up your creator profile. Start with your name and username.",
  footerText: 'The social platform where creators connect and build together.',
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
