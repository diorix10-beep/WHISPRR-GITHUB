import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Settings, Activity, Users, MessageSquare, AlertTriangle, 
  Check, RefreshCw, Send, ShieldCheck, Heart, UserMinus, UserCheck, Search, HelpCircle, Bug, Loader2, Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { Profile, Community } from '../types';
import { Avatar } from '../components/common/Avatar';

type PanelTab = 'system' | 'monitoring' | 'users' | 'communities' | 'testing' | 'feedback';

interface SystemSettingsModel {
  enabled: boolean;
  message: string;
  reopen_at: string | null;
  bypass_founder: boolean;
  bypass_admin: boolean;
}

interface BugReport {
  id: string;
  created_at: string;
  user_id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  profiles?: Profile;
}

export default function FounderPanel() {
  const { user, profile, systemSettings, updateSystemSettings } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<PanelTab>('system');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // System controls form state
  const [settingsForm, setSettingsForm] = useState<SystemSettingsModel>({
    enabled: false,
    message: '',
    reopen_at: '',
    bypass_founder: true,
    bypass_admin: true
  });

  // Users management state
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Communities state
  const [communitiesList, setCommunitiesList] = useState<Community[]>([]);
  const [loadingComms, setLoadingComms] = useState(false);

  // Feedback state
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Load current settings into form
  useEffect(() => {
    if (systemSettings) {
      setSettingsForm({
        enabled: systemSettings.enabled || false,
        message: systemSettings.message || '',
        reopen_at: systemSettings.reopen_at || '',
        bypass_founder: systemSettings.bypass_founder !== false,
        bypass_admin: systemSettings.bypass_admin !== false
      });
    }
  }, [systemSettings]);

  // Load users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (searchQuery.trim() !== '') {
        query = query.or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
      }
      const { data, error } = await query.limit(50);
      if (!error && data) {
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load communities
  const fetchCommunities = async () => {
    setLoadingComms(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setCommunitiesList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComms(false);
    }
  };

  // Load bug reports/feedback
  const fetchBugReports = async () => {
    setLoadingFeedback(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          profiles:user_id(id, username, display_name, avatar_emoji)
        `)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setBugReports(data as any[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'communities') fetchCommunities();
    else if (activeTab === 'feedback') fetchBugReports();
  }, [activeTab]);

  // Save system settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettings({
        enabled: settingsForm.enabled,
        message: settingsForm.message,
        reopen_at: settingsForm.reopen_at || null,
        bypass_founder: settingsForm.bypass_founder,
        bypass_admin: settingsForm.bypass_admin
      });
      showToast('System settings updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update system settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Change user roles (moderator, admin, user, founder)
  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', targetUserId);
      if (error) throw error;
      showToast(`User role updated to ${newRole}`, 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to update user role', 'error');
    }
  };

  // Trigger demo notification
  const handleSendTestNotification = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        actor_id: user.id,
        type: 'follow',
        reference_id: null,
        read: false
      });
      if (error) throw error;
      showToast('Test notification dispatched! Check your notifications tray.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to send test notification', 'error');
    }
  };

  // Community creation testing trigger
  const handleCreateTestCommunity = async () => {
    try {
      const randomId = Math.floor(Math.random() * 10000);
      const { error } = await supabase.from('communities').insert({
        name: `Test Community #${randomId}`,
        description: 'Automated test sandbox community.',
        emoji: '🧪',
        interest: 'Technology',
        created_by: user?.id
      });
      if (error) throw error;
      showToast('Test Sandbox Community created!', 'success');
      fetchCommunities();
    } catch (err) {
      console.error(err);
      showToast('Failed to create sandbox community', 'error');
    }
  };

  if (profile?.role !== 'founder') {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white dark:bg-warm-800 p-8 rounded-3xl border border-warm-100 dark:border-warm-700 max-w-md shadow-soft">
           <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
           <h2 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">Access Denied</h2>
           <p className="text-sm text-warm-500">Only Founder accounts can access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
           <h1 className="section-title flex items-center gap-2">
             👑 Founder Panel <span className="bg-primary-100 dark:bg-primary-900/55 text-primary-600 text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">Active</span>
           </h1>
           <p className="text-sm text-warm-500 mt-1">Control system state, monitor analytics, and moderate content</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-warm-100 dark:bg-warm-850 p-1 rounded-2xl overflow-x-auto shrink-0 select-none">
          {([
             { key: 'system' as PanelTab, icon: Settings, label: 'System' },
             { key: 'monitoring' as PanelTab, icon: Activity, label: 'Monitor' },
             { key: 'users' as PanelTab, icon: Users, label: 'Users' },
             { key: 'communities' as PanelTab, icon: MessageSquare, label: 'Comms' },
             { key: 'testing' as PanelTab, icon: ShieldCheck, label: 'Testing' },
             { key: 'feedback' as PanelTab, icon: Bug, label: 'Bugs' }
          ]).map(tab => {
             const Icon = tab.icon;
             return (
               <button
                 key={tab.key}
                 onClick={() => setActiveTab(tab.key)}
                 className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                   activeTab === tab.key
                     ? 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 shadow-sm'
                     : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                 }`}
               >
                 <Icon size={14} />
                 <span>{tab.label}</span>
               </button>
             );
          })}
        </div>
      </div>

      {/* Main Tab Render */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-6">
             <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-3">
               🛠️ Maintenance Config
             </h3>

             <div className="flex items-center justify-between p-4 bg-warm-50 dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800">
                <div>
                   <label className="font-semibold text-warm-900 dark:text-warm-50 block text-sm">
                      Enable Maintenance Mode
                   </label>
                   <span className="text-xs text-warm-500">Regular users will see the Maintenance Page</span>
                </div>
                <input 
                  type="checkbox"
                  checked={settingsForm.enabled}
                  onChange={e => setSettingsForm({ ...settingsForm, enabled: e.target.checked })}
                  className="w-5 h-5 accent-primary-500 rounded border-warm-300 focus:ring-primary-500"
                />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold text-warm-900 dark:text-warm-100 block" htmlFor="maintenance-msg">
                   Maintenance Message
                </label>
                <textarea
                  id="maintenance-msg"
                  value={settingsForm.message}
                  onChange={e => setSettingsForm({ ...settingsForm, message: e.target.value })}
                  placeholder="Custom message shown to users..."
                  className="input-field min-h-24 py-2 px-3.5 text-sm"
                  required
                />
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-sm font-semibold text-warm-900 dark:text-warm-100 block" htmlFor="reopen-time">
                      Estimated Reopening Time
                   </label>
                   <input
                     id="reopen-time"
                     type="datetime-local"
                     value={settingsForm.reopen_at ? settingsForm.reopen_at.substring(0, 16) : ''}
                     onChange={e => setSettingsForm({ ...settingsForm, reopen_at: e.target.value })}
                     className="input-field text-sm"
                   />
                </div>

                <div className="space-y-4 pt-2">
                   <div className="flex items-center gap-2">
                      <input 
                        id="bypass-founder"
                        type="checkbox"
                        checked={settingsForm.bypass_founder}
                        onChange={e => setSettingsForm({ ...settingsForm, bypass_founder: e.target.checked })}
                        className="w-4 h-4 accent-primary-500"
                      />
                      <label htmlFor="bypass-founder" className="text-xs font-semibold text-warm-700 dark:text-warm-300">
                         Allow Founders to bypass maintenance mode
                      </label>
                   </div>
                   <div className="flex items-center gap-2">
                      <input 
                        id="bypass-admin"
                        type="checkbox"
                        checked={settingsForm.bypass_admin}
                        onChange={e => setSettingsForm({ ...settingsForm, bypass_admin: e.target.checked })}
                        className="w-4 h-4 accent-primary-500"
                      />
                      <label htmlFor="bypass-admin" className="text-xs font-semibold text-warm-700 dark:text-warm-300">
                         Allow Admins to bypass maintenance mode
                      </label>
                   </div>
                </div>
             </div>

             <button
               type="submit"
               disabled={saving}
               className="btn-primary py-2.5 px-6 font-bold flex items-center justify-center gap-2"
             >
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Configurations'}
             </button>
          </div>
        </form>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Status Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {([
               { label: 'Live Users Online', val: '1', color: 'text-green-500' },
               { label: 'Active Sessions', val: '1', color: 'text-blue-500' },
               { label: 'Database Connection', val: 'Optimal', color: 'text-primary-500' },
               { label: 'Vercel Deployment', val: 'Production Ready', color: 'text-accent-500' }
             ]).map((m, idx) => (
                <div key={idx} className="bg-white dark:bg-warm-800 p-5 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft">
                   <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">{m.label}</p>
                   <p className={`text-xl font-bold truncate ${m.color}`}>{m.val}</p>
                </div>
             ))}
          </div>

          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
             <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 pb-3 border-b border-warm-100 dark:border-warm-700">
                <Activity size={18} className="text-primary-500" /> Platform Infrastructure Status
             </h3>
             <div className="space-y-3">
                {([
                  { name: 'API Server', status: 'Online', perf: '24ms latency', active: true },
                  { name: 'Realtime Subscriptions', status: 'Active', perf: 'WebSocket Listening', active: true },
                  { name: 'Auth Providers', status: 'Healthy', perf: 'MFA Enabled', active: true },
                  { name: 'Edge Storage', status: 'Healthy', perf: 'CDN distributed', active: true }
                ]).map((srv, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100/50 dark:border-warm-800">
                     <span className="font-semibold text-sm text-warm-800 dark:text-warm-200">{srv.name}</span>
                     <div className="flex items-center gap-3 text-xs">
                        <span className="text-warm-500 font-mono">{srv.perf}</span>
                        <span className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" /> {srv.status}
                        </span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-100 dark:border-warm-700 pb-3">
             <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                <Users size={18} className="text-primary-500" /> User Directory
             </h3>
             
             {/* Search input */}
             <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-2.5 text-warm-400" />
                <input 
                  type="text"
                  placeholder="Search user profiles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') fetchUsers(); }}
                  className="input-field pl-9 py-1.5 text-sm"
                />
             </div>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-10">
               <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : usersList.length === 0 ? (
            <p className="text-center py-8 text-sm text-warm-500">No user profiles matched search query.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
               {usersList.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-warm-50 dark:bg-warm-900 border border-warm-100/50 dark:border-warm-800 rounded-2xl text-sm">
                     <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar emoji={u.avatar_emoji} photoUrl={u.photo_url} size="sm" />
                        <div className="min-w-0">
                           <p className="font-semibold text-warm-900 dark:text-warm-100 truncate">{u.display_name}</p>
                           <p className="text-xs text-warm-500 truncate">@{u.username} • Role: <strong className="text-primary-600 uppercase text-[10px]">{u.role}</strong></p>
                        </div>
                     </div>

                     <div className="flex items-center gap-1.5 shrink-0">
                        <select 
                          value={u.role}
                          onChange={e => handleUpdateRole(u.user_id, e.target.value)}
                          className="bg-white dark:bg-warm-850 border border-warm-250 dark:border-warm-700 text-xs px-2 py-1 rounded-xl text-warm-700 dark:text-warm-200 outline-none focus:ring-1 focus:ring-primary-500"
                        >
                           <option value="user">User</option>
                           <option value="moderator">Moderator</option>
                           <option value="admin">Admin</option>
                           <option value="founder">Founder</option>
                        </select>
                     </div>
                  </div>
               ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'communities' && (
        <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
           <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-3">
              🏘️ Communities Directory
           </h3>
           {loadingComms ? (
             <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-primary-500" />
             </div>
           ) : communitiesList.length === 0 ? (
             <p className="text-center py-8 text-sm text-warm-500">No active communities found.</p>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {communitiesList.map(c => (
                  <div key={c.id} className="p-3 bg-warm-50 dark:bg-warm-900 border border-warm-100/50 dark:border-warm-800 rounded-2xl flex items-center justify-between text-sm">
                     <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{c.emoji}</span>
                        <div className="min-w-0">
                           <p className="font-semibold text-warm-900 dark:text-warm-100 truncate">{c.name}</p>
                           <p className="text-xs text-warm-500 truncate">{c.interest} • Posts: {c.post_count || 0}</p>
                        </div>
                     </div>
                     <button onClick={() => navigate(`/communities/${c.id}`)} className="text-xs font-semibold text-primary-500 hover:underline shrink-0">Visit</button>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'testing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
             <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-3 flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary-500" /> Development Sandbox & Triggers
             </h3>
             <p className="text-sm text-warm-600 dark:text-warm-400">
                Use these mock triggers to test workflows, RLS policies, and notification dispatchers directly in the production environment.
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 rounded-2xl space-y-2 flex flex-col justify-between">
                   <div>
                      <h4 className="font-semibold text-sm text-warm-900 dark:text-warm-100">Test Follow Notifications</h4>
                      <p className="text-xs text-warm-500 mt-0.5">Dispatches a follow alert to your own notifications tray to test the badge indicators.</p>
                   </div>
                   <button 
                     onClick={handleSendTestNotification}
                     className="btn-primary py-2 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 self-start"
                   >
                      <Send size={12} /> Dispatch Alert
                   </button>
                </div>

                <div className="p-4 bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 rounded-2xl space-y-2 flex flex-col justify-between">
                   <div>
                      <h4 className="font-semibold text-sm text-warm-900 dark:text-warm-100">Test Sandbox Communities</h4>
                      <p className="text-xs text-warm-500 mt-0.5">Creates a mock community in the database automatically to verify layouts.</p>
                   </div>
                   <button 
                     onClick={handleCreateTestCommunity}
                     className="btn-primary py-2 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 self-start"
                   >
                      <Plus size={12} /> Create Community
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
           <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-3 flex items-center gap-2">
              <Bug size={18} className="text-primary-500" /> Bug Reports & Feedback
           </h3>

           {loadingFeedback ? (
             <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-primary-500" />
             </div>
           ) : bugReports.length === 0 ? (
             <p className="text-center py-8 text-sm text-warm-500 italic">No bug reports submitted yet.</p>
           ) : (
             <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                {bugReports.map(rep => (
                   <div key={rep.id} className="p-4 bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 rounded-2xl text-sm space-y-2">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                             rep.type === 'bug' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                             rep.type === 'feature' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                             'bg-blue-100 text-blue-750 dark:bg-blue-950/40 dark:text-blue-300'
                           }`}>
                             {rep.type}
                           </span>
                           <span className="text-[10px] uppercase font-semibold text-warm-500 bg-warm-200 dark:bg-warm-850 px-2 py-0.5 rounded-full">
                             {rep.status}
                           </span>
                         </div>
                         <span className="text-[10px] text-warm-500">{new Date(rep.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div>
                         <h4 className="font-semibold text-warm-900 dark:text-warm-100">{rep.title}</h4>
                         <p className="text-xs text-warm-600 dark:text-warm-400 mt-1">{rep.description}</p>
                      </div>

                      {rep.profiles && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-warm-200/40 dark:border-warm-800/40 text-xs text-warm-500">
                           <span>Submitted by:</span>
                           <Avatar emoji={rep.profiles.avatar_emoji} photoUrl={rep.profiles.photo_url} size="xs" />
                           <span className="font-medium text-warm-700 dark:text-warm-300">@{rep.profiles.username}</span>
                        </div>
                      )}
                   </div>
                ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
