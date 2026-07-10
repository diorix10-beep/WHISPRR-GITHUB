import { X, Sparkles, Bot, Globe, Layers, ArrowRight } from 'lucide-react';
import { Logo } from '../common/Logo';

interface ChimeraPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const chimeraUrl = isLocalhost ? 'http://localhost:5174' : 'https://chimera.whisprr.xyz';

export function ChimeraPromoModal({ isOpen, onClose }: ChimeraPromoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-warm-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-warm-900 border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col">
        
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
          
          <div className="relative mb-6 mt-4">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse-slow"></div>
            <Logo size={72} className="relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] text-red-500" />
          </div>

          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-wide mb-3">
            Welcome to CHIMERA
          </h2>
          
          <p className="text-warm-300 text-base md:text-lg mb-8 leading-relaxed max-w-sm">
            Create characters, build worlds, manage personas, and experience immersive AI roleplay.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Bot className="text-red-400" size={24} />
              <span className="text-sm font-medium text-warm-200">AI Characters</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Globe className="text-purple-400" size={24} />
              <span className="text-sm font-medium text-warm-200">Living Worlds</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Layers className="text-amber-400" size={24} />
              <span className="text-sm font-medium text-warm-200">Deep Lorebooks</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Sparkles className="text-indigo-400" size={24} />
              <span className="text-sm font-medium text-warm-200">Smart Personas</span>
            </div>
          </div>

          <a
            href={chimeraUrl}
            className="w-full py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
          >
            Launch CHIMERA
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
          
          <p className="text-xs text-warm-400 mt-4">
            CHIMERA is part of the WHISPRR ecosystem. You will be signed in automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
