import { useState, Component, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  X, Compass, Users, MessageCircle, User, Sparkles, Mic, Brain, BookOpen, Globe,
  Settings, LogOut, Sun, Moon, Monitor, LayoutGrid, Search, PenTool, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creativeMode: 'roleplay' | 'storytelling';
  onToggleCreativeMode: () => void;
  onOpenAppLauncher: () => void;
  onOpenSearch: () => void;
}

class DrawerErrorBoundary extends Component<{ children: ReactNode; onClose: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.error('[Mobile Drawer Error Catch]:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-4">
          <p className="text-xs text-warm-500">Navigation drawer experienced a minor issue.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs"
          >
            Close & Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function MobileNavigationDrawer({
  isOpen,
  onClose,
  creativeMode,
  onToggleCreativeMode,
  onOpenAppLauncher,
  onOpenSearch
}: MobileNavigationDrawerProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { preference, setPreference } = useTheme();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    onClose();
    await signOut();
    navigate('/auth');
  };

  const ALL_NAV_ITEMS = [
    { path: '/discover', label: 'Discover', icon: Compass },
    { path: '/characters', label: 'Characters', icon: Users },
    { path: '/conversations', label: 'Chats', icon: MessageCircle },
    { path: '/personas', label: 'Personas', icon: User },
    { path: '/studio', label: 'Creator Studio', icon: Sparkles },
    { path: '/voices', label: 'Voice Studio', icon: Mic },
    { path: '/memory', label: 'Memory Manager', icon: Brain },
    { path: '/lorebooks', label: 'Lorebooks', icon: BookOpen },
    { path: '/worlds', label: 'Worlds', icon: Globe },
  ];

  return (
    <DrawerErrorBoundary onClose={onClose}>
      <div className="fixed inset-0 z-[9999] lg:hidden animate-fade-in">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-warm-950/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Drawer Container */}
        <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-warm-900 border-r border-warm-200 dark:border-warm-800 shadow-2xl flex flex-col z-50">
          
          {/* Header */}
          <div className="p-4 border-b border-warm-200 dark:border-warm-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/chimera_logo.png" alt="CHIMERA" className="w-7 h-7 rounded-lg object-cover" />
              <span className="font-serif font-bold text-base text-red-600 dark:text-red-500">
                CHIMERA Nexus
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Profile Card */}
          {profile && (
            <div className="p-4 border-b border-warm-100 dark:border-warm-800/80 bg-warm-50/50 dark:bg-warm-950/40 flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer overflow-hidden"
                onClick={() => { onClose(); navigate('/profile'); }}
              >
                <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="sm" />
                <div className="overflow-hidden">
                  <span className="font-bold text-xs text-warm-900 dark:text-white block truncate">
                    {profile.display_name}
                  </span>
                  <span className="text-[10px] text-warm-400 block truncate">
                    @{profile.username || 'creator'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Creative Mode Switcher */}
          <div className="p-3 border-b border-warm-100 dark:border-warm-800">
            <div className="text-[10px] uppercase font-bold tracking-wider text-warm-400 mb-1.5 px-1">
              Mode Switcher
            </div>
            <div className="flex bg-warm-200/70 dark:bg-warm-800/70 p-0.5 rounded-xl">
              <button
                onClick={() => creativeMode !== 'roleplay' && onToggleCreativeMode()}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  creativeMode === 'roleplay'
                    ? 'bg-white dark:bg-warm-900 text-red-600 dark:text-red-400 shadow-sm'
                    : 'text-warm-500'
                }`}
              >
                <MessageSquare size={13} /> Roleplay
              </button>
              <button
                onClick={() => creativeMode !== 'storytelling' && onToggleCreativeMode()}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  creativeMode === 'storytelling'
                    ? 'bg-white dark:bg-warm-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-warm-500'
                }`}
              >
                <PenTool size={13} /> Story
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-3 grid grid-cols-2 gap-2 border-b border-warm-100 dark:border-warm-800">
            <button
              onClick={() => { onClose(); onOpenSearch(); }}
              className="px-3 py-2 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-750 text-warm-700 dark:text-warm-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Search size={14} /> Search
            </button>
            <button
              onClick={() => { onClose(); onOpenAppLauncher(); }}
              className="px-3 py-2 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-750 text-warm-700 dark:text-warm-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LayoutGrid size={14} /> Hub
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
            <div className="text-[10px] uppercase font-bold tracking-wider text-warm-400 mb-1 px-2">
              Navigation
            </div>
            {ALL_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-extrabold'
                        : 'text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer: Theme & Settings */}
          <div className="p-3 border-t border-warm-200 dark:border-warm-800 space-y-2">
            <div className="flex gap-1.5">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPreference(mode)}
                  className={`flex-1 py-1.5 flex justify-center rounded-lg border text-xs ${
                    preference === mode
                      ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950 font-bold'
                      : 'border-warm-200 dark:border-warm-800 text-warm-500'
                  }`}
                >
                  {mode === 'light' ? <Sun size={14} /> : mode === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 pt-1">
              <button
                onClick={() => { onClose(); navigate('/settings'); }}
                className="flex-1 py-2 px-3 text-xs font-bold text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Settings size={14} /> Settings
              </button>
              {profile && (
                <button
                  onClick={handleSignOut}
                  className="py-2 px-3 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </DrawerErrorBoundary>
  );
}
