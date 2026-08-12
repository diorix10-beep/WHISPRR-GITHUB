import { useState, useEffect, useMemo } from 'react';
import { Sparkles, MessageSquare, Globe, PenTool, Bot, Heart, Play, ShieldCheck, Flame, ChevronRight } from 'lucide-react';

interface PreviewCharacter {
  name: string;
  tagline: string;
  category: string;
  avatar: string;
  quote: string;
  likes: number;
}

const PREVIEW_CHARACTERS: PreviewCharacter[] = [
  {
    name: 'Eldrin Vance',
    tagline: 'Archmage of the Silver Citadel',
    category: 'High Fantasy',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    quote: '"Magic is not merely spoken—it is woven from the fabric of memory itself."',
    likes: 1420,
  },
  {
    name: 'Lyra Thorne',
    tagline: 'Cybernetics Specialist & Hacker',
    category: 'Cyberpunk',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    quote: '"Jack into the grid. The corps think they own the city, but we own the code."',
    likes: 980,
  },
  {
    name: 'Kaelen Voss',
    tagline: 'Rogue Captain of the Obsidian Void',
    category: 'Sci-Fi Opera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    quote: '"The stars are vast, kid. But out here, loyalty is the only currency that matters."',
    likes: 2150,
  },
];

export function AuthHero() {
  const [activeCharIndex, setActiveCharIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCharIndex((prev) => (prev + 1) % PREVIEW_CHARACTERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const activeChar = PREVIEW_CHARACTERS[activeCharIndex];

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 12 + Math.random() * 10,
        delay: Math.random() * 8,
        drift: (Math.random() - 0.5) * 50,
        opacity: 0.2 + Math.random() * 0.4,
      })),
    []
  );

  return (
    <div className="relative w-full h-full overflow-hidden hidden lg:flex flex-col justify-between p-12 bg-warm-950 text-white select-none hero-fade-in">
      
      {/* Deep Studio Ambient Glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-warm-950 via-warm-900 to-warm-950 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-red-600/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-amber-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating Ember & Star Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="auth-particle rounded-full bg-amber-400/40 pointer-events-none"
          style={
            {
              left: `${p.left}%`,
              '--p-size': `${p.size}px`,
              '--p-duration': `${p.duration}s`,
              '--p-delay': `${p.delay}s`,
              '--p-drift': `${p.drift}px`,
              '--p-opacity': p.opacity,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Top Studio Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-warm-900/80 backdrop-blur-xl border border-white/10 text-amber-400 text-xs font-extrabold uppercase tracking-wider shadow-lg">
          <Sparkles size={14} className="animate-pulse text-amber-400" />
          <span>CHIMERA Creative Studio</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-warm-400 font-medium">
          <span className="flex items-center gap-1.5"><Bot size={14} className="text-red-400" /> AI Characters</span>
          <span className="flex items-center gap-1.5"><Globe size={14} className="text-purple-400" /> Universes</span>
          <span className="flex items-center gap-1.5"><PenTool size={14} className="text-amber-400" /> Stories</span>
        </div>
      </div>

      {/* Center Cinematic Preview Showcase */}
      <div className="relative z-10 max-w-xl mx-auto my-auto space-y-8 w-full">
        
        {/* Main Headline */}
        <div className="space-y-3 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Create characters. <br />
            Build worlds. <br />
            <span className="bg-gradient-to-r from-red-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
              Begin stories.
            </span>
          </h2>
          <p className="text-sm text-warm-300 leading-relaxed max-w-md mx-auto">
            A beautiful, unified creative studio where persistent AI identities, lorebooks, and interactive narratives come alive.
          </p>
        </div>

        {/* Live Interactive Character Preview Card */}
        <div className="p-6 rounded-3xl bg-warm-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-5 transition-all duration-500 hover:border-amber-500/40">
          
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-md flex-shrink-0">
              <img
                src={activeChar.avatar}
                alt={activeChar.name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white truncate">{activeChar.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase border border-purple-500/30">
                  {activeChar.category}
                </span>
              </div>
              <p className="text-xs text-warm-400 truncate">{activeChar.tagline}</p>
            </div>

            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <Heart size={12} fill="currentColor" />
              <span>{activeChar.likes}</span>
            </div>
          </div>

          {/* Roleplay Chat Glimpse Snippet */}
          <div className="p-4 rounded-2xl bg-warm-950/80 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              <MessageSquare size={12} />
              <span>Live Roleplay Glimpse</span>
            </div>
            <p className="text-xs text-warm-200 font-serif italic leading-relaxed">
              {activeChar.quote}
            </p>
          </div>

          {/* Character Switcher Indicators */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-warm-400 font-medium">Featured Persona Showcase</span>
            <div className="flex items-center gap-1.5">
              {PREVIEW_CHARACTERS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCharIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === activeCharIndex ? 'w-6 bg-amber-400' : 'bg-warm-750 hover:bg-warm-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Footer Quote */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-warm-400">
        <span className="flex items-center gap-2 font-medium">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>Private, distraction-free creative workspace.</span>
        </span>

        <span className="font-serif text-warm-300 italic">
          CHIMERA Platform v1.0
        </span>
      </div>

    </div>
  );
}
