import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, User, Compass, Bot, Sparkles, Calendar, 
  Shield, Camera, Edit3, X, Check, Loader2, LogOut,
  Globe, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { UniversalImagePicker } from '../components/common/UniversalImagePicker';

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ characters: 0, personas: 0, worlds: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', bio: '', pronouns: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && profile) {
      setEditForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        pronouns: profile.pronouns || '',
      });
      fetchStats();
    }
  }, [user, profile]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [{ count: personasCount }, { count: charsCount }] = await Promise.all([
        supabase.from('personas').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('ai_characters').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
      ]);
      setStats({ characters: charsCount || 0, personas: personasCount || 0, worlds: 0 });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile(editForm);
      showToast('Profile updated!', 'success');
      setIsEditing(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); navigate('/auth'); } catch { /* silent */ }
  };

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const statsConfig = [
    { icon: Bot, label: 'Characters', value: stats.characters, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-100 dark:border-red-500/20', action: () => navigate('/characters') },
    { icon: User, label: 'Personas', value: stats.personas, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20', action: () => navigate('/personas') },
    { icon: Compass, label: 'Worlds', value: stats.worlds, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', action: () => navigate('/worlds') },
  ];

  const quickLinks = [
    { icon: Sparkles, label: 'Creator Studio', desc: 'Publish & monetize your work', action: () => navigate('/studio') },
    { icon: Globe, label: 'Worldbuilding', desc: 'Build and manage your worlds', action: () => navigate('/worlds') },
    { icon: Settings, label: 'Account Settings', desc: 'Privacy, security, preferences', action: () => navigate('/settings') },
  ];

  return (
    <div className="flex-1 pb-24 md:pb-0 overflow-y-auto animate-fade-in">

      {/* ── Banner ── */}
      <div className="relative h-40 sm:h-52 overflow-hidden">
        {profile?.banner_url ? (
          <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-600/80 via-rose-500/60 to-purple-600/60 dark:from-red-900/60 dark:via-rose-800/40 dark:to-purple-900/50" />
        )}
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-warm-50 dark:from-warm-950 via-transparent to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10">
        
        {/* ── Avatar + Actions row ── */}
        <div className="flex items-end justify-between -mt-14 sm:-mt-16 mb-5">
          {/* Avatar */}
          <button
            onClick={() => setShowPhotoUpload(true)}
            className="group relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-warm-50 dark:border-warm-950 bg-warm-100 dark:bg-warm-800 shadow-xl overflow-hidden shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Change profile photo"
          >
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl select-none">
                {profile?.avatar_emoji || '💫'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1">
              <Camera size={20} />
              <span className="text-[10px] font-black uppercase tracking-wider">Update</span>
            </div>
          </button>

          {/* Action buttons */}
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => { setIsEditing(!isEditing); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                isEditing
                  ? 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 border-warm-200 dark:border-warm-700 hover:bg-warm-200'
                  : 'bg-white dark:bg-warm-800 text-warm-800 dark:text-warm-200 border-warm-200 dark:border-warm-700 hover:bg-warm-50 dark:hover:bg-warm-750 shadow-sm'
              }`}
            >
              {isEditing ? <><X size={15} />Cancel</> : <><Edit3 size={15} />Edit Profile</>}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 flex items-center justify-center bg-white dark:bg-warm-800 text-warm-600 dark:text-warm-400 rounded-2xl border border-warm-200 dark:border-warm-700 shadow-sm hover:bg-warm-50 dark:hover:bg-warm-750 transition-all active:scale-95"
              aria-label="Settings"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        {/* ── Profile Info or Edit Form ── */}
        {isEditing ? (
          <form
            onSubmit={handleSave}
            className="mb-6 bg-white dark:bg-warm-900 rounded-3xl border border-warm-100 dark:border-warm-800 shadow-sm p-5 sm:p-6 space-y-4 animate-fade-in"
          >
            <h3 className="font-serif text-lg font-extrabold text-warm-900 dark:text-white">Edit Profile</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-warm-400 dark:text-warm-500">Display Name</label>
              <input
                type="text"
                value={editForm.display_name}
                onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl text-sm font-semibold text-warm-900 dark:text-white placeholder:text-warm-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-warm-400 dark:text-warm-500">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell your creative story…"
                className="w-full px-4 py-2.5 bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl text-sm text-warm-900 dark:text-white placeholder:text-warm-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors resize-none leading-relaxed"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-warm-400 dark:text-warm-500">Pronouns</label>
              <input
                type="text"
                value={editForm.pronouns}
                onChange={e => setEditForm({ ...editForm, pronouns: e.target.value })}
                placeholder="e.g. they/them, she/her"
                className="w-full px-4 py-2.5 bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl text-sm text-warm-900 dark:text-white placeholder:text-warm-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-red-500/20 hover:shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><Check size={14} />Save Changes</>}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-warm-900 dark:text-white leading-tight">
                {profile?.display_name}
              </h1>
              {profile?.role === 'founder' && (
                <Shield size={18} className="text-red-500 fill-red-500 shrink-0" />
              )}
            </div>
            <p className="text-sm text-warm-400 dark:text-warm-500 font-medium mb-3">@{profile?.username}</p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-warm-500 dark:text-warm-400 font-medium mb-3">
              {joinDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  Joined {joinDate}
                </span>
              )}
              {profile?.pronouns && (
                <span className="px-2.5 py-1 bg-warm-100 dark:bg-warm-800 rounded-full border border-warm-200 dark:border-warm-750 text-warm-600 dark:text-warm-300">
                  {profile.pronouns}
                </span>
              )}
              {(profile as any)?.home_country && (
                <span className="flex items-center gap-1">
                  <Globe size={13} />
                  {(profile as any).home_country}
                </span>
              )}
            </div>

            {profile?.bio && (
              <p className="text-sm text-warm-700 dark:text-warm-300 leading-relaxed max-w-xl whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
          </div>
        )}

        {/* ── Creator Stats ── */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-warm-400 dark:text-warm-500 mb-3">Creative Output</p>
          <div className="grid grid-cols-3 gap-3">
            {statsConfig.map(({ icon: Icon, label, value, color, bg, border, action }) => (
              <button
                key={label}
                onClick={action}
                className={`group flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 bg-white dark:bg-warm-900 ${border}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${bg}`}>
                  <Icon size={20} className={color} />
                </div>
                <div className="text-2xl font-extrabold text-warm-900 dark:text-white font-serif">
                  {loading ? '—' : value}
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-warm-400 mt-0.5">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. ACHIEVEMENTS & BADGES SHOWCASE ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-warm-400 dark:text-warm-500">Achievements &amp; Badges</p>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              4 Badges Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-warm-900 border border-amber-500/30 shadow-sm text-center space-y-1 relative overflow-hidden group">
              <div className="text-2xl">🏆</div>
              <h4 className="text-xs font-bold text-warm-900 dark:text-white">Pioneer Creator</h4>
              <p className="text-[10px] text-warm-400">Created 1+ character in CHIMERA</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-warm-900 border border-blue-500/30 shadow-sm text-center space-y-1 relative overflow-hidden group">
              <div className="text-2xl">💎</div>
              <h4 className="text-xs font-bold text-warm-900 dark:text-white">Shard Holder</h4>
              <p className="text-[10px] text-warm-400">Earned &amp; gifted SHARDS</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-warm-900 border border-purple-500/30 shadow-sm text-center space-y-1 relative overflow-hidden group">
              <div className="text-2xl">🌌</div>
              <h4 className="text-xs font-bold text-warm-900 dark:text-white">World Architect</h4>
              <p className="text-[10px] text-warm-400">Built a custom World Nexus</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-warm-900 border border-pink-500/30 shadow-sm text-center space-y-1 relative overflow-hidden group">
              <div className="text-2xl">✍️</div>
              <h4 className="text-xs font-bold text-warm-900 dark:text-white">Grand Author</h4>
              <p className="text-[10px] text-warm-400">Published web novel story</p>
            </div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-warm-400 dark:text-warm-500 mb-3">Creator Tools</p>
          <div className="bg-white dark:bg-warm-900 rounded-3xl border border-warm-100 dark:border-warm-800 overflow-hidden shadow-sm divide-y divide-warm-50 dark:divide-warm-800">
            {quickLinks.map(({ icon: Icon, label, desc, action }) => (
              <button
                key={label}
                onClick={action}
                className="group w-full flex items-center gap-4 px-5 py-4 hover:bg-warm-50 dark:hover:bg-warm-800/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500"
              >
                <div className="w-9 h-9 rounded-xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center shrink-0 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 transition-colors">
                  <Icon size={17} className="text-warm-500 group-hover:text-red-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-warm-900 dark:text-warm-100">{label}</p>
                  <p className="text-xs text-warm-400 dark:text-warm-500 font-medium">{desc}</p>
                </div>
                <ChevronRight size={15} className="text-warm-300 dark:text-warm-600 group-hover:text-red-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Sign Out ── */}
        <div className="mb-12">
          <button
            onClick={handleSignOut}
            className="group flex items-center gap-3 px-5 py-4 w-full rounded-2xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/25 text-warm-600 dark:text-warm-400 hover:text-red-600 dark:hover:text-red-400 transition-all text-sm font-bold active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Photo Upload Modal ── */}
      {showPhotoUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPhotoUpload(false); }}
        >
          <div className="bg-white dark:bg-warm-900 rounded-3xl p-6 w-full max-w-sm space-y-4 border border-warm-200 dark:border-warm-800 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-extrabold text-lg text-warm-900 dark:text-white">Profile Avatar</h3>
              <button
                onClick={() => setShowPhotoUpload(false)}
                className="p-1.5 rounded-xl text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 hover:text-warm-700 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <UniversalImagePicker
              value={profile?.photo_url || null}
              onChange={async (url) => {
                await updateProfile({ photo_url: url });
                setShowPhotoUpload(false);
                showToast('Profile avatar updated!', 'success');
              }}
              shape="circle"
              aspectRatio={1}
              label="Profile Photo"
            />
          </div>
        </div>
      )}
    </div>
  );
}
