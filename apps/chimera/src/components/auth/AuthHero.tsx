import { Sparkles } from 'lucide-react';
import { Logo } from '../common/Logo';

export function AuthHero() {
  return (
    <div className="text-center mb-8 flex flex-col items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse-slow"></div>
        <Logo size={64} className="relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-500" />
      </div>
      <div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-white tracking-wide mb-2 drop-shadow-md">
          Welcome to CHIMERA
        </h1>
        <div className="flex items-center justify-center gap-2 text-warm-300 font-medium text-lg">
          <Sparkles size={18} className="text-red-400" />
          <span>Create. Imagine. Roleplay.</span>
          <Sparkles size={18} className="text-red-400" />
        </div>
      </div>
    </div>
  );
}
