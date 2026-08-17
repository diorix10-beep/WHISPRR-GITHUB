import { X, MessageCircle, BookOpen, ArrowRight } from 'lucide-react';
import { ChimeraLogo } from '../common/ChimeraLogo';

interface ChimeraPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const chimeraUrl = isLocalhost ? 'http://localhost:5174' : 'https://chimera.it.com';

export function ChimeraPromoModal({ isOpen, onClose }: ChimeraPromoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-warm-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#090b18] border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Immersive Background matching CHIMERA's auth page */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/40 rounded-full blur-[80px] mix-blend-screen"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-900/30 rounded-full blur-[70px] mix-blend-screen"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-warm-300 hover:text-white transition-all backdrop-blur-sm"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 p-8 flex flex-col items-center text-center">
          
          <div className="relative mb-5 mt-2">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse-slow"></div>
            <div className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-3xl border border-rose-400/30 bg-gradient-to-br from-rose-500/30 via-purple-500/20 to-amber-500/20 shadow-[0_0_30px_rgba(239,68,68,.25)]">
              <ChimeraLogo size={48} className="drop-shadow-[0_0_15px_rgba(239,68,68,0.55)]" />
            </div>
          </div>

          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.24em] text-amber-300">A different creative space</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-wide mb-3">
            Welcome to CHIMERA
          </h2>
          
          <p className="text-warm-300 text-base md:text-lg mb-6 leading-relaxed max-w-sm">
            Characters with a pulse. Worlds with a soul. Step into a creative home for roleplay, writing, and worldbuilding.
          </p>

          <div className="grid grid-cols-2 gap-3 w-full mb-7 text-left">
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
              <MessageCircle className="mb-5 text-rose-300" size={22} />
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-rose-200">Roleplay</p>
              <p className="mt-1 text-xs leading-relaxed text-warm-300">Create characters, personas, and stories that unfold together.</p>
            </div>
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
              <BookOpen className="mb-5 text-violet-200" size={22} />
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-violet-200">Storytelling</p>
              <p className="mt-1 text-xs leading-relaxed text-warm-300">Write in VELLUM, shape worlds, chapters, scenes, and your own voice.</p>
            </div>
          </div>

          <a
            href={`${chimeraUrl}/?from=whisprr&entry=app-switcher`}
            className="w-full py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
          >
            Enter CHIMERA
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
          
          <p className="text-xs text-warm-400 mt-4 leading-relaxed">
            New here? CHIMERA will introduce its two creative spaces before you begin.
          </p>
        </div>
      </div>
    </div>
  );
}
