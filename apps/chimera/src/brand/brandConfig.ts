export type ProductId = 'chimera';

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
  ecosystem: {
    name: string;
    domain: string;
    whisprrUrl: string;
  };
}

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

const CHIMERA: BrandConfig = {
  id: 'chimera',
  name: 'CHIMERA',
  shortName: 'CHIMERA',
  tagline: 'Where Stories Come to Life.',
  heroTagline: 'Create characters. Build worlds. Write stories. Your way.',
  description: 'CHIMERA is a complete creation platform for storytellers and world builders. Build characters, craft worlds, write stories — with or without AI.',
  themeColor: '#E84C3D',
  domain: 'chimera.whisprr.xyz',
  ogImage: 'https://chimera.whisprr.xyz/pwa-512x512.png',
  loadingText: 'Entering CHIMERA...',
  authSubtitle: 'Create. Write. Imagine.',
  onboardingWelcome: 'Welcome to CHIMERA',
  onboardingSubtitle: "Let's set up your creator profile. Start with your name and username.",
  footerText: 'Part of the WHISPRR Ecosystem.',
  supportEmail: 'help@chimera.whisprr.xyz',
  ecosystem: {
    name: 'WHISPRR',
    domain: 'whisprr.xyz',
    whisprrUrl: isLocalhost ? 'http://localhost:5174' : 'https://whisprr.xyz',
  },
};

export const brand: BrandConfig = CHIMERA;

export function getBrand(): BrandConfig {
  return brand;
}
