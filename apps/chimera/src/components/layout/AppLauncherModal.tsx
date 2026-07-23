import { useNavigate } from 'react-router-dom';
import { 
  X, User, Bookmark, Settings, 
  Layers, HelpCircle, Shield, FileText
} from 'lucide-react';
import { WhisprrLogo } from '../common/WhisprrLogo';
import { Logo } from '../common/Logo';

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
    { name: 'WHISPRR', desc: 'Social Network', path: `${whisprrUrl}/feed`, icon: WhisprrLogo, color: 'bg-primary-500/10 text-primary-500 border-primary-500/20 hover:bg-primary-500/20', external: true },
    { name: 'CHIMERA', desc: 'Roleplay & Storytelling', path: '/', icon: Logo, color: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' },
  ];

  const moreLinks = [
    { label: 'My Profile', path: '/profile', icon: User },
    { label: 'Saved & Bookmarks', path: `${whisprrUrl}/discover?tab=bookmarks`, icon: Bookmark, external: true },
    { label: 'CHIMERA Studio / Drafts', path: '/personas', icon: FileText },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Account Security', path: '/settings', icon: Shield },
    { label: 'Platform Trust Center', path: '/trust', icon: Layers },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-warm-950/80 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-750 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col gap-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:scale-105 active:scale-95 transition-all"
          aria-label="Close launcher"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="text-center mt-2">
          <h2 className="font-serif text-2xl font-bold text-warm-900 dark:text-warm-50">Ecosystem Hub</h2>
          <p className="text-xs text-warm-500 mt-1">Quick switch between WHISPRR workspaces</p>
        </div>

        {/* Apps Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-warm-400 mb-3 px-1">Available Apps</h3>
          <div className="grid grid-cols-2 gap-3">
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.name}
                  onClick={() => handleNavigate(app.path, app.external)}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all hover:scale-102 active:scale-98 ${app.color}`}
                >
                  {Icon && <Icon size={24} />}
                  <div>
                    <h4 className="font-bold text-sm leading-none">{app.name}</h4>
                    <p className="text-[10px] opacity-75 mt-1">{app.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-warm-100 dark:border-warm-800" />

        {/* More Menu List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-warm-400 mb-3 px-1">Features & Tools</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {moreLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  onClick={() => handleNavigate(link.path, link.external)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-warm-700 dark:text-warm-350 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors text-left"
                >
                  <Icon size={16} className="text-warm-500" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
