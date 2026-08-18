import React, { Component } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  X, Compass, Users, MessageSquare, User, Sparkles,
  BookOpen, Globe, Settings, LogOut, Sun, Moon, Monitor, Search,
  PenTool, Feather, Bookmark, Gem
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';
import { ShardCrystalImage } from '../common/ShardCrystalImage';
import { useTranslation } from '../../hooks/useTranslation';

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
                  { path: '/stories', label: 'Stories' },
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
  const { t } = useTranslation();
  const isRoleplay = creativeMode === 'roleplay';
  
  // Safe auth context access
  let profile = null;
  let signOut = async () => {};
  let shardsBalance: number | null = null;
  let vellumBalance: number | null = null;
  try {
    const auth = useAuth();
    profile = auth.profile;
    signOut = auth.signOut;
    shardsBalance = auth.shardsBalance;
    vellumBalance = auth.vellumBalance;
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
    { path: '/discover', label: t('navigation.discover'), icon: Compass },
    { path: '/characters', label: t('navigation.my_cast'), icon: Users },
    { path: '/human-roleplay', label: t('navigation.human_roleplay'), icon: Users },
    { path: '/conversations', label: t('navigation.chats'), icon: MessageSquare },
    { path: '/personas', label: t('navigation.who_you_are_here'), icon: User },
  ] : [
    { path: '/workspace', label: 'Workspace', icon: Feather },
    { path: '/stories', label: 'Stories', icon: BookOpen },
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
      <div className={`relative z-50 flex h-[100dvh] max-h-[100dvh] w-80 max-w-[85vw] flex-col overflow-hidden border-r shadow-2xl animate-in slide-in-from-left duration-200 ${isRoleplay ? 'border-[#c99b50]/35 bg-[#0a0b11] text-[#f5ead7]' : 'border-warm-200 bg-white dark:border-warm-800 dark:bg-warm-900'}`}>
        
        {/* Header */}
        <div className={`flex shrink-0 items-center justify-between border-b p-4 ${isRoleplay ? 'border-[#c99b50]/25 bg-[#090a10]/90' : 'border-warm-200 bg-warm-50/50 dark:border-warm-800 dark:bg-warm-950/50'}`}>
          <div className="flex items-center gap-2">
            <span className={`font-serif text-lg font-extrabold tracking-wider bg-clip-text text-transparent ${
              creativeMode === 'storytelling'
                ? 'bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400'
                : 'bg-gradient-to-r from-[#f8d796] via-[#d5a957] to-[#9b642f]'
            }`}>
              CHIMERA
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              creativeMode === 'storytelling' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'border border-[#c99b50]/40 bg-[#2b2116] text-[#e8c378]'
            }`}>
              {creativeMode === 'storytelling' ? 'Storytelling 📖' : 'Roleplay 🎭'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className={`rounded-full p-1 transition-colors ${isRoleplay ? 'text-[#b9ad9c] hover:bg-[#c99b50]/10 hover:text-[#ffe8b5]' : 'text-warm-400 hover:bg-warm-100 hover:text-warm-700 dark:hover:bg-warm-800 dark:hover:text-warm-200'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Creative Mode Toggle */}
        <div className={`shrink-0 border-b p-3 ${isRoleplay ? 'border-[#c99b50]/20 bg-black/25' : 'border-warm-100 bg-warm-50 dark:border-warm-800 dark:bg-warm-950/30'}`}>
          <div className={`mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest ${isRoleplay ? 'text-[#b9ad9c]' : 'text-warm-400'}`}>
            Creative Workspace
          </div>
          <div className={`flex rounded-xl p-0.5 ${isRoleplay ? 'border border-[#c99b50]/35 bg-black/35' : 'bg-warm-200/70 dark:bg-warm-800/70'}`}>
            <button
              onClick={() => toggleCreativeMode('roleplay')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                creativeMode === 'roleplay'
                  ? 'bg-[#2b2116] text-[#ffe7b5] shadow-md ring-1 ring-[#c99b50]/70'
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

          {/* The reserve follows the active creative space. */}
          <button
            onClick={() => {
              onClose();
              navigate(creativeMode === 'storytelling' ? '/vellum' : '/shards');
            }}
            className={`mt-2.5 flex w-full items-center justify-between rounded-xl border p-2.5 text-xs font-bold shadow-sm transition-all ${creativeMode === 'storytelling' ? 'border-[#c89d57]/40 bg-[#10213b]/80 text-[#f1d9aa] hover:bg-[#173050]/90' : 'border-[#b882d2]/45 bg-[linear-gradient(135deg,rgba(43,18,70,0.94),rgba(25,13,44,0.95))] text-[#f2daff] hover:border-[#e2b9f7]/70'}`}
          >
            <div className="flex items-center gap-2">
              {creativeMode === 'storytelling' ? <img src="/images/vellum-sigil.svg" alt="VELLUM" className="h-5 w-5 rounded-md" /> : <ShardCrystalImage size={20} showGlow={false} />}
              <span>{creativeMode === 'storytelling' ? 'VELLUM Story Reserve' : 'SHARDS Hub'}</span>
            </div>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${creativeMode === 'storytelling' ? 'border-[#c89d57]/40 bg-[#c89d57]/10 text-[#f1d9aa]' : 'border-[#cda0ea]/35 bg-[#6d3a91]/35 text-[#ecd4ff]'}`}>
              {creativeMode === 'storytelling' ? (vellumBalance === null ? 'VELLUM · loading…' : `${vellumBalance.toLocaleString()} VELLUM`) : (shardsBalance === null ? 'SHARDS · loading…' : `${shardsBalance.toLocaleString()} SHARDS`)}
            </span>
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6">
          
          {/* Main Links */}
          <div className="space-y-1">
            <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isRoleplay ? 'text-[#b9ad9c]' : 'text-warm-400'}`}>
              {creativeMode === 'storytelling' ? 'Author Navigation' : 'Roleplay Rooms'}
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
                          : 'border border-[#c99b50]/45 bg-[#2b2116] text-[#f0ce8e]'
                        : isRoleplay
                          ? 'text-[#d5c8b5] hover:bg-[#c99b50]/10 hover:text-[#ffe8b5]'
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
          <div className={`border-t pt-2 ${isRoleplay ? 'border-[#c99b50]/20' : 'border-warm-100 dark:border-warm-800'}`}>
            <div className={`mb-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isRoleplay ? 'text-[#b9ad9c]' : 'text-warm-400'}`}>
              Quick Actions
            </div>
            <button
              onClick={() => {
                onClose();
                navigate(creativeMode === 'storytelling' ? '/stories/new' : '/characters/new');
              }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                creativeMode === 'storytelling'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                  : 'border border-[#dfb96e] bg-[linear-gradient(135deg,#8d5f2e,#c9964f,#7f532a)] text-[#fff6e3] shadow-[#6b451f]/40 hover:brightness-110'
              }`}
            >
              <PenTool size={14} />
              <span>{creativeMode === 'storytelling' ? '+ Write Story' : '+ Bring someone into CHIMERA'}</span>
            </button>
          </div>

          {/* Search Button */}
          <button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors ${isRoleplay ? 'border-[#c99b50]/30 bg-black/25 text-[#d5c8b5] hover:border-[#c99b50]/65 hover:text-[#fff0be]' : 'border-warm-200 bg-warm-50 text-warm-600 hover:border-warm-300 dark:border-warm-750 dark:bg-warm-850 dark:text-warm-300 dark:hover:border-warm-650'}`}
          >
            <Search size={16} />
            <span>{creativeMode === 'storytelling' ? 'Search stories & authors...' : 'Search characters, moods, or worlds...'}</span>
          </button>
        </div>

        {/* Footer: User Profile & Preferences */}
        <div className={`shrink-0 space-y-3 border-t p-4 ${isRoleplay ? 'border-[#c99b50]/25 bg-[#090a10]/90' : 'border-warm-200 bg-warm-50/50 dark:border-warm-800 dark:bg-warm-950/50'}`}>
          
          {/* Theme Selector */}
          <div className={`flex rounded-lg p-0.5 text-xs ${isRoleplay ? 'border border-[#c99b50]/25 bg-black/30' : 'bg-warm-200/50 dark:bg-warm-800/50'}`}>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPreference(t)}
                className={`flex-1 py-1 rounded-md capitalize font-semibold transition-all ${
                  preference === t
                    ? isRoleplay ? 'bg-[#2b2116] text-[#f7dfaa] shadow-sm' : 'bg-white text-warm-900 shadow-sm dark:bg-warm-900 dark:text-warm-50'
                    : isRoleplay ? 'text-[#a99e8f] hover:text-[#f4d390]' : 'text-warm-500 hover:text-warm-800 dark:hover:text-warm-200'
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
                  <p className={`truncate text-xs font-bold ${isRoleplay ? 'text-[#fff3df]' : 'text-warm-900 dark:text-warm-50'}`}>
                    {profile.display_name || profile.username}
                  </p>
                  <p className={`truncate text-[10px] ${isRoleplay ? 'text-[#b9ad9c]' : 'text-warm-400'}`}>@{profile.username}</p>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className={`rounded-lg p-2 transition-colors ${isRoleplay ? 'text-[#b9ad9c] hover:bg-[#c99b50]/10 hover:text-[#f0ce8e]' : 'text-warm-400 hover:bg-warm-100 hover:text-red-500 dark:hover:bg-warm-800'}`}
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
              className={`w-full rounded-xl py-2 text-xs font-bold shadow-md ${isRoleplay ? 'border border-[#dfb96e] bg-[linear-gradient(135deg,#8d5f2e,#c9964f,#7f532a)] text-[#fff6e3]' : 'bg-red-600 text-white'}`}
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
