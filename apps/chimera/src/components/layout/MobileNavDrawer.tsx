import React, { Component } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  X, Compass, Users, MessageSquare, User, Sparkles,
  BookOpen, Globe, Settings, LogOut, Sun, Moon, Monitor, Search,
  PenTool, Feather, Bookmark
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creativeMode: 'roleplay' | 'storytelling';
  toggleCreativeMode: (mode?: 'roleplay' | 'storytelling') => void;
  onOpenSearch: () => void;
  onOpenAppLauncher: () => void;
}

class DrawerErrorBoundary extends Component<
  { children: React.ReactNode; onClose: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onClose: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('MobileNavDrawer local error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="lg:hidden fixed inset-0 z-[9999] flex">
          <div 
            className="fixed inset-0 bg-warm-950/60 backdrop-blur-sm"
            onClick={this.props.onClose}
          />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-warm-900 h-[100dvh] max-h-[100dvh] p-6 shadow-2xl flex flex-col justify-between z-50 overflow-hidden">
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center justify-between border-b border-warm-200 dark:border-warm-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg font-bold text-red-600 dark:text-red-500">CHIMERA</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                    Nexus
                  </span>
                </div>
                <button onClick={this.props.onClose} className="p-1 text-warm-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <div className="px-2 text-[10px] font-bold text-warm-400 uppercase tracking-wider">Navigation</div>
                {[
                  { path: '/discover', label: 'Discover' },
                  { path: '/write/desk', label: 'Stories' },
                  { path: '/worlds', label: 'Worlds' },
                ].map(item => (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={this.props.onClose}
                    className="block px-3 py-2.5 rounded-xl text-xs font-semibold text-warm-800 dark:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-800"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <button
              onClick={this.props.onClose}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-xl text-xs shadow-md mt-4 flex-shrink-0"
            >
              Close Menu
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MobileNavDrawerContent({
  isOpen,
  onClose,
  creativeMode,
  toggleCreativeMode,
  onOpenSearch,
}: MobileNavDrawerProps) {
  const navigate = useNavigate();
  
  // Safe auth context access
  let profile = null;
  let signOut = async () => {};
  try {
    const auth = useAuth();
    profile = auth.profile;
    signOut = auth.signOut;
  } catch (e) {
    console.warn('AuthContext inside MobileNavDrawer:', e);
  }

  // Safe theme context access
  let preference: 'light' | 'dark' | 'system' = 'dark';
  let setPreference = (_pref: 'light' | 'dark' | 'system') => {};
  try {
    const themeCtx = useTheme();
    preference = themeCtx.preference;
    setPreference = themeCtx.setPreference;
  } catch (e) {
    console.warn('ThemeContext inside MobileNavDrawer:', e);
  }

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
  ] : [
    { path: '/', label: 'Home', icon: Compass },
    { path: '/write/desk', label: 'Stories', icon: BookOpen },
    { path: '/worlds', label: 'Worlds', icon: Globe },
  ];

  return (
    <div className="lg:hidden fixed inset-0 z-[9999] flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-warm-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-white dark:bg-warm-900 h-[100dvh] max-h-[100dvh] shadow-2xl border-r border-warm-200 dark:border-warm-800 flex flex-col z-50 animate-in slide-in-from-left duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-warm-200 dark:border-warm-800 flex items-center justify-between bg-warm-50/50 dark:bg-warm-950/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={`font-serif text-lg font-bold ${creativeMode === 'storytelling' ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-500'}`}>
              CHIMERA
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              creativeMode === 'storytelling' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-red-500/10 text-red-500'
            }`}>
              {creativeMode === 'storytelling' ? 'Storytelling 📖' : 'Roleplay 🎭'}
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
        <div className="p-3 border-b border-warm-100 dark:border-warm-800 bg-warm-50 dark:bg-warm-950/30 flex-shrink-0">
          <div className="text-[10px] uppercase font-bold tracking-widest text-warm-400 mb-1.5 px-1">
            Creative Workspace
          </div>
          <div className="flex bg-warm-200/70 dark:bg-warm-800/70 p-0.5 rounded-xl">
            <button
              onClick={() => toggleCreativeMode('roleplay')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                creativeMode === 'roleplay'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare size={14} /> Roleplay
            </button>
            <button
              onClick={() => toggleCreativeMode('storytelling')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                creativeMode === 'storytelling'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
              }`}
            >
              <PenTool size={14} /> Storytelling
            </button>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6">
          
          {/* Main Links */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-warm-400 uppercase tracking-wider">
              {creativeMode === 'storytelling' ? 'Author Navigation' : 'Roleplay Navigation'}
            </div>
            {mainLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? creativeMode === 'storytelling'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        : 'text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-warm-100 dark:border-warm-800">
            <div className="px-3 py-1 text-[10px] font-bold text-warm-400 uppercase tracking-wider mb-2">
              Quick Actions
            </div>
            <button
              onClick={() => {
                onClose();
                navigate(creativeMode === 'storytelling' ? '/write/desk' : '/studio');
              }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                creativeMode === 'storytelling'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
              }`}
            >
              <PenTool size={14} />
              <span>{creativeMode === 'storytelling' ? '+ Write Story' : '+ Create Character'}</span>
            </button>
          </div>

          {/* Search Button */}
          <button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-850 text-warm-600 dark:text-warm-300 text-xs font-semibold hover:border-warm-300 dark:hover:border-warm-650 transition-colors"
          >
            <Search size={16} />
            <span>{creativeMode === 'storytelling' ? 'Search stories & authors...' : 'Search characters...'}</span>
          </button>
        </div>

        {/* Footer: User Profile & Preferences */}
        <div className="p-4 border-t border-warm-200 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-950/50 flex-shrink-0 space-y-3">
          
          {/* Theme Selector */}
          <div className="flex bg-warm-200/50 dark:bg-warm-800/50 p-0.5 rounded-lg text-xs">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPreference(t)}
                className={`flex-1 py-1 rounded-md capitalize font-semibold transition-all ${
                  preference === t
                    ? 'bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-50 shadow-sm'
                    : 'text-warm-500 hover:text-warm-800 dark:hover:text-warm-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* User Profile / Sign In */}
          {profile ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  photoUrl={profile.photo_url}
                  emoji={profile.avatar_emoji}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-warm-900 dark:text-warm-50 truncate">
                    {profile.display_name || profile.username}
                  </p>
                  <p className="text-[10px] text-warm-400 truncate">@{profile.username}</p>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="p-2 text-warm-400 hover:text-red-500 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                navigate('/auth');
              }}
              className="w-full py-2 bg-red-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MobileNavDrawer(props: MobileNavDrawerProps) {
  return (
    <DrawerErrorBoundary onClose={props.onClose}>
      <MobileNavDrawerContent {...props} />
    </DrawerErrorBoundary>
  );
}
