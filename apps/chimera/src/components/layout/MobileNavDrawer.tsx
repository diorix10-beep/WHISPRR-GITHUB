import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  X, Compass, Users, MessageSquare, User, Sparkles, Mic, Sliders, 
  BookOpen, Globe, Settings, LogOut, Sun, Moon, Monitor, Search, Grid3X3,
  PenTool
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creativeMode: 'roleplay' | 'storytelling';
  toggleCreativeMode: () => void;
  onOpenSearch: () => void;
  onOpenAppLauncher: () => void;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  creativeMode,
  toggleCreativeMode,
  onOpenSearch,
  onOpenAppLauncher,
}: MobileNavDrawerProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { preference, setPreference } = useTheme();
  const [drawerError, setDrawerError] = useState(false);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      navigate('/auth');
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const mainLinks = creativeMode === 'roleplay' ? [
    { path: '/discover', label: 'Discover', icon: Compass },
    { path: '/characters', label: 'Characters', icon: Users },
    { path: '/conversations', label: 'Chats', icon: MessageSquare },
    { path: '/personas', label: 'Personas', icon: User },
    { path: '/studio', label: 'Creator Studio', icon: Sparkles },
    { path: '/voices', label: 'Voice Studio', icon: Mic },
    { path: '/models', label: 'AI Brains & API Vault', icon: Sliders },
  ] : [
    { path: '/', label: 'Home', icon: Compass },
    { path: '/stories', label: 'Stories', icon: BookOpen },
    { path: '/worlds', label: 'Worlds', icon: Globe },
    { path: '/studio', label: 'Creator Studio', icon: Sparkles },
  ];

  return (
    <div className="lg:hidden fixed inset-0 z-[9999] flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-warm-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-white dark:bg-warm-900 h-full shadow-2xl border-r border-warm-200 dark:border-warm-800 flex flex-col z-50 animate-in slide-in-from-left duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-warm-200 dark:border-warm-800 flex items-center justify-between bg-warm-50/50 dark:bg-warm-950/50">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold text-red-600 dark:text-red-500">CHIMERA</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
              Nexus
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 rounded-full hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Creative Mode Toggle */}
        <div className="p-3 border-b border-warm-100 dark:border-warm-800 bg-warm-50 dark:bg-warm-950/30">
          <div className="text-[10px] uppercase font-bold tracking-widest text-warm-400 mb-1.5 px-1">
            Creative Mode
          </div>
          <div className="flex bg-warm-200/70 dark:bg-warm-800/70 p-0.5 rounded-xl">
            <button
              onClick={() => creativeMode !== 'roleplay' && toggleCreativeMode()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                creativeMode === 'roleplay'
                  ? 'bg-white dark:bg-warm-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-warm-500 hover:text-warm-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare size={14} /> Roleplay
            </button>
            <button
              onClick={() => creativeMode !== 'storytelling' && toggleCreativeMode()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                creativeMode === 'storytelling'
                  ? 'bg-white dark:bg-warm-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-warm-500 hover:text-warm-900 dark:hover:text-white'
              }`}
            >
              <PenTool size={14} /> Story
            </button>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          
          {/* Main Links */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-warm-400 uppercase tracking-wider">
              Navigation
            </div>
            {mainLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold'
                        : 'text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="space-y-1 pt-2 border-t border-warm-100 dark:border-warm-800">
            <div className="px-3 py-1 text-[10px] font-bold text-warm-400 uppercase tracking-wider">
              Quick Tools
            </div>
            
            <button
              onClick={() => { onClose(); onOpenSearch(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-all text-left"
            >
              <Search size={18} />
              <span>Search Nexus (⌘K)</span>
            </button>

            <button
              onClick={() => { onClose(); onOpenAppLauncher(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-all text-left"
            >
              <Grid3X3 size={18} className="text-red-500" />
              <span>WHISPRR Ecosystem Hub</span>
            </button>
          </div>

          {/* Theme Preference */}
          <div className="space-y-2 pt-2 border-t border-warm-100 dark:border-warm-800">
            <div className="px-3 text-[10px] font-bold text-warm-400 uppercase tracking-wider">
              Theme Mode
            </div>
            <div className="flex gap-2 px-1">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPreference(mode)}
                  className={`flex-1 py-2 flex items-center justify-center rounded-xl border text-xs font-bold transition-all ${
                    preference === mode
                      ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/40'
                      : 'border-warm-200 dark:border-warm-800 text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'
                  }`}
                >
                  {mode === 'light' ? <Sun size={15} /> : mode === 'dark' ? <Moon size={15} /> : <Monitor size={15} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer User Profile & Settings */}
        {profile && (
          <div className="p-4 border-t border-warm-200 dark:border-warm-800 bg-warm-50/70 dark:bg-warm-950/70 space-y-3">
            <div 
              onClick={() => { onClose(); navigate('/profile'); }}
              className="flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl hover:bg-warm-200/50 dark:hover:bg-warm-800/50 transition-colors"
            >
              <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="md" />
              <div className="overflow-hidden flex-1">
                <h4 className="text-xs font-bold text-warm-900 dark:text-white truncate">
                  {profile.display_name}
                </h4>
                <p className="text-[10px] text-warm-500 truncate">
                  @{profile.username}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { onClose(); navigate('/settings'); }}
                className="flex-1 py-2 px-3 bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-750 hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-800 dark:text-warm-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Settings size={14} /> Settings
              </button>
              <button
                onClick={handleSignOut}
                className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
