import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, Compass, Bot, Sparkles, MapPin, Calendar, Edit2, Shield, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';
import type { Persona } from '../types';

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    characters: 0,
    personas: 0,
    worlds: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    pronouns: '',
  });
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
      
      // Personas
      const { count: personasCount } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      // Characters
      const { count: charsCount } = await supabase
        .from('ai_characters')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);
        
      // Worlds (Placeholder for now until worlds table exists)
      const worldsCount = 0;

      setStats({
        characters: charsCount || 0,
        personas: personasCount || 0,
        worlds: worldsCount,
      });
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
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (err) {
      console.error(err);
    }
  };

  const joinDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <div className="flex-1 pb-24 md:pb-0 overflow-y-auto animate-fade-in">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-primary-600 to-accent-600 relative overflow-hidden group">
        {profile?.banner_url && (
          <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-warm-50 dark:border-warm-950 bg-warm-100 dark:bg-warm-800 shadow-xl overflow-hidden relative">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  {profile?.avatar_emoji || '💫'}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-2.5 bg-white dark:bg-warm-800 hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-900 dark:text-warm-50 font-bold rounded-xl border border-warm-200 dark:border-warm-700 shadow-sm transition-all"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button 
              className="w-11 h-11 flex items-center justify-center bg-white dark:bg-warm-800 hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-700 dark:text-warm-300 rounded-xl border border-warm-200 dark:border-warm-700 shadow-sm transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="bg-white dark:bg-warm-900 rounded-2xl p-6 border border-warm-200 dark:border-warm-800 shadow-sm mb-8 space-y-4">
            <h3 className="font-bold text-xl mb-4">Edit Profile</h3>
            
            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-1">Display Name</label>
              <input 
                type="text" 
                value={editForm.display_name}
                onChange={e => setEditForm({...editForm, display_name: e.target.value})}
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-1">Bio</label>
              <textarea 
                value={editForm.bio}
                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-2 resize-y"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-1">Pronouns</label>
              <input 
                type="text" 
                value={editForm.pronouns}
                onChange={e => setEditForm({...editForm, pronouns: e.target.value})}
                placeholder="e.g. they/them"
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-2"
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">
                {profile?.display_name}
              </h1>
              {profile?.role === 'founder' && (
                <Shield size={20} className="text-primary-500 fill-primary-500" />
              )}
            </div>
            <p className="text-warm-600 dark:text-warm-400 font-medium">@{profile?.username}</p>
            
            <div className="flex items-center gap-4 mt-3 text-sm text-warm-600 dark:text-warm-400">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                Joined {joinDate}
              </div>
              {profile?.pronouns && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-warm-100 dark:bg-warm-800 rounded-md">
                  {profile.pronouns}
                </div>
              )}
            </div>

            {profile?.bio && (
              <p className="mt-4 text-warm-800 dark:text-warm-200 whitespace-pre-wrap max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        )}

        {/* Creator Stats */}
        <h2 className="text-xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-4">Ecosystem Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-warm-900 p-6 rounded-2xl border border-warm-200 dark:border-warm-800 shadow-sm flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary-300 transition-colors">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Bot size={24} />
            </div>
            <div className="text-2xl font-bold text-warm-900 dark:text-warm-50">{stats.characters}</div>
            <div className="text-sm font-bold text-warm-500 uppercase tracking-wider">Characters</div>
          </div>
          
          <div 
            onClick={() => navigate('/personas')}
            className="bg-white dark:bg-warm-900 p-6 rounded-2xl border border-warm-200 dark:border-warm-800 shadow-sm flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary-300 transition-colors"
          >
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <User size={24} />
            </div>
            <div className="text-2xl font-bold text-warm-900 dark:text-warm-50">{stats.personas}</div>
            <div className="text-sm font-bold text-warm-500 uppercase tracking-wider">Personas</div>
          </div>
          
          <div className="bg-white dark:bg-warm-900 p-6 rounded-2xl border border-warm-200 dark:border-warm-800 shadow-sm flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary-300 transition-colors col-span-2 md:col-span-1">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Compass size={24} />
            </div>
            <div className="text-2xl font-bold text-warm-900 dark:text-warm-50">{stats.worlds}</div>
            <div className="text-sm font-bold text-warm-500 uppercase tracking-wider">Worlds</div>
          </div>
        </div>
        
        {/* Account Actions */}
        <div className="bg-white dark:bg-warm-900 p-6 rounded-2xl border border-warm-200 dark:border-warm-800 shadow-sm mb-12">
          <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50 mb-4">Account</h2>
          <button 
            onClick={handleSignOut}
            className="w-full md:w-auto px-6 py-3 bg-warm-100 dark:bg-warm-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 font-bold rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
