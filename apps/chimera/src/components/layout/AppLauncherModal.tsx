import { useNavigate } from 'react-router-dom';
import { 
  X, User, Bookmark, Settings, 
  Layers, HelpCircle, Shield, FileText, Sparkles, Users, Globe, Volume2, ArrowRight
} from 'lucide-react';
import { WhisprrLogo } from '../common/WhisprrLogo';
import { ShardCrystalImage } from '../common/ShardCrystalImage';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const whisprrUrl = isLocalhost ? 'http://localhost:5174' : 'https://whisprr.xyz';

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppLauncherModal({ isOpen, onClose }: AppLauncherModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigate = (path: string, external?: boolean) => {
    if (external) {
      window.location.href = path;
    } else {
      navigate(path);
    }
    onClose();
  };

  const apps = [
    { name: 'WHISPRR', desc: 'Social Creator Network', path: `${whisprrUrl}/feed`, icon: WhisprrLogo, color: 'bg-primary-500/10 text-primary-500 border-primary-500/30 hover:bg-primary-500/20', external: true },
    { name: 'CHIMERA', desc: 'Roleplay & Storytelling', path: '/discover', logoUrl: '/chimera_logo.png', color: 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20' },
    { name: 'SHARDS Hub', desc: 'Ecosystem Currency & VIP', path: '/shards', isShard: true, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20' },
  ];

  const features = [
    { label: 'AI Characters', path: '/characters', icon: Users },
    { label: 'Roleplay Personas', path: '/personas', icon: User },
    { label: 'Worldbuilding Studio', path: '/worlds', icon: Globe },
    { label: 'Creator Studio', path: '/studio', icon: Sparkles },
    { label: 'Voice Library', path: '/voice-library', icon: Volume2 },
    { label: 'Account Settings', path: '/settings', icon: Settings },
    { label: 'Trust & Privacy Center', path: '/trust', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-warm-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-750 shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col gap-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:scale-105 active:scale-95 transition-all"
          aria-label="Close launcher"
        >
          <X size={18} />
        </button>

        {/* Title & Ambient Header */}
        <div className="text-center space-y-1 mt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-extrabold uppercase tracking-widest">
            <Sparkles size={12} />
            <span>Universal Ecosystem Switcher</span>
          </div>

          <h2 className="font-serif text-3xl font-extrabold bg-gradient-to-r from-red-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
            Ecosystem Hub
          </h2>

          <p className="text-xs text-warm-500 dark:text-warm-400">
            Seamlessly switch between CHIMERA creative engines &amp; WHISPRR social networks
          </p>
        </div>

        {/* Primary Apps Grid */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-warm-400 px-1">
            Ecosystem Applications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.name}
                  onClick={() => handleNavigate(app.path, app.external)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all hover:scale-102 active:scale-98 shadow-sm ${app.color}`}
                >
                  <div className="flex items-center justify-between">
                    {app.isShard ? (
                      <ShardCrystalImage size={24} showGlow={false} />
                    ) : 'logoUrl' in app && app.logoUrl ? (
                      <img src={app.logoUrl} alt={app.name} className="w-7 h-7 object-contain drop-shadow" />
                    ) : Icon ? (
                      <Icon size={24} />
                    ) : null}
                    
                    <ArrowRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div>
                    <h4 className="font-serif font-extrabold text-sm leading-none">{app.name}</h4>
                    <p className="text-[10px] opacity-80 mt-1">{app.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-warm-100 dark:border-warm-800" />

        {/* Features & Tools Grid */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-warm-400 px-1">
            Creation Tools &amp; Workspaces
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-warm-800 dark:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-purple-500 group-hover:scale-110 transition-transform" />
                    <span>{item.label}</span>
                  </div>

                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-warm-400" />
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
