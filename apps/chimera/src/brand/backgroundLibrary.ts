export type ChimeraBackgroundKey =
  | 'roleplay'
  | 'gameHub'
  | 'storytelling'
  | 'storyProject'
  | 'trust'
  | 'shards'
  | 'vellum';

export type ChimeraBackground = {
  image: string;
  mobilePosition: string;
  desktopPosition: string;
  overlay: string;
  label: string;
};

/** The single source of truth for CHIMERA's atmospheric surfaces. */
export const CHIMERA_BACKGROUNDS: Record<ChimeraBackgroundKey, ChimeraBackground> = {
  roleplay: {
    image: '/images/chimera_castle_hero_bg.jpg',
    mobilePosition: '58% center',
    desktopPosition: 'right center',
    overlay: 'linear-gradient(90deg, rgba(4,5,9,.98), rgba(5,6,11,.88) 38%, rgba(7,7,12,.64) 74%, rgba(7,7,12,.8))',
    label: 'Moonlit CHIMERA roleplay realm',
  },
  gameHub: {
    image: '/images/bg_worlds.jpg',
    mobilePosition: '62% center',
    desktopPosition: 'center',
    overlay: 'linear-gradient(90deg, rgba(5,6,12,.96), rgba(7,8,15,.82) 48%, rgba(7,8,15,.58))',
    label: 'Shared Game Hub world',
  },
  storytelling: {
    image: '/images/storytelling-workspace-hero-v1.png',
    mobilePosition: '58% center',
    desktopPosition: 'center',
    overlay: 'linear-gradient(180deg, rgba(8,20,38,.86), rgba(8,20,38,.95))',
    label: 'VELLUM storytelling studio',
  },
  storyProject: {
    image: '/images/bg_stories.jpg',
    mobilePosition: 'center',
    desktopPosition: 'center',
    overlay: 'linear-gradient(180deg, rgba(8,8,14,.68), rgba(8,8,14,.94))',
    label: 'Story Project atmosphere',
  },
  trust: {
    image: '/guardian-library-night-v1.png',
    mobilePosition: '62% top',
    desktopPosition: 'center top',
    overlay: 'linear-gradient(180deg, rgba(5,7,17,.7), rgba(5,7,17,.92))',
    label: "Guardian's Library",
  },
  shards: {
    image: '/images/bg_worlds.jpg',
    mobilePosition: 'center',
    desktopPosition: 'center',
    overlay: 'linear-gradient(135deg, rgba(16,10,31,.95), rgba(11,16,32,.86))',
    label: 'SHARDS reserve',
  },
  vellum: {
    image: '/images/storytelling-workspace-hero-v1.png',
    mobilePosition: 'center',
    desktopPosition: 'center',
    overlay: 'linear-gradient(135deg, rgba(8,20,38,.9), rgba(18,15,28,.94))',
    label: 'VELLUM reserve',
  },
};

export function backgroundStyle(key: ChimeraBackgroundKey, mobile = false): React.CSSProperties {
  const background = CHIMERA_BACKGROUNDS[key];
  return {
    backgroundImage: `${background.overlay}, url('${background.image}')`,
    backgroundPosition: mobile ? background.mobilePosition : background.desktopPosition,
  };
}
