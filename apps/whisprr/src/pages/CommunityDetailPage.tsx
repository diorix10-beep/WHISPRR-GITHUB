import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Users, Shield, ScrollText,
  Image as ImageIcon, Loader2, X, Settings, Trash2,
  BarChart2, AlertTriangle, Calendar, Briefcase, Trophy,
  Globe, Sparkles, Compass, Plus, BookOpen, Check
} from 'lucide-react';
import type { 
  Community, CommunityMember, Profile, Whisper, Reaction,
  CommunityCollaboration, CommunityFeatured, CommunityEvent 
} from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useInterests } from '../contexts/InterestContext';
import { useToast } from '../contexts/ToastContext';
import { Avatar } from '../components/common/Avatar';
import { WhisperCard } from '../components/feed/WhisperCard';
import { UserBadges } from '../components/common/UserBadges';
import { ComposeWhisper } from '../components/feed/ComposeWhisper';

interface CommunityMemberWithProfile extends CommunityMember {
  profiles: Profile;
}

interface WhisperWithRelations extends Whisper {
  profiles: Profile;
  reactions: Reaction[];
  comment_count: number;
}

const getContextualBadges = (baseBadges: string[] = [], memberRole?: string) => {
  const list = [...baseBadges];
  if (memberRole === 'owner') {
    list.push('community_creator');
  } else if (memberRole === 'moderator' || memberRole === 'admin') {
    list.push('community_moderator');
  }
  return list;
};

type TabType = 'feed' | 'collaborations' | 'featured' | 'events' | 'members' | 'rules' | 'manage';

export default function CommunityDetailPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track } = useInterests();
  const { showToast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMemberWithProfile[]>([]);
  const [whispers, setWhispers] = useState<WhisperWithRelations[]>([]);
  const [collaborations, setCollaborations] = useState<CommunityCollaboration[]>([]);
  const [featured, setFeatured] = useState<CommunityFeatured[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  
  const [isUserMember, setIsUserMember] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'moderator' | 'member' | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCommunity, setDeletingCommunity] = useState(false);
  const [editingRules, setEditingRules] = useState(false);
  const [rulesText, setRulesText] = useState('');
  const [savingRules, setSavingRules] = useState(false);

  // Collaboration form state
  const [showAddCollab, setShowAddCollab] = useState(false);
  const [collabForm, setCollabForm] = useState({
    role_needed: 'writer' as any,
    title: '',
    description: '',
  });

  // Featured form state
  const [showAddFeatured, setShowAddFeatured] = useState(false);
  const [featuredForm, setFeaturedForm] = useState({
    asset_type: 'character' as any,
    title: '',
    description: '',
    asset_id: '',
  });

  // Event form state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'writing_challenge' as any,
    start_date: '',
    end_date: '',
  });

  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const moderators = members.filter(m => ['owner', 'admin', 'moderator'].includes(m.role));

  const loadCommunity = useCallback(async () => {
    if (!communityId) return;
    const { data } = await supabase.from('communities').select('*').eq('id', communityId).single();
    if (data) setCommunity(data);
  }, [communityId]);

  const checkMembership = useCallback(async () => {
    if (!user || !communityId) return;
    const { data } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) { setIsUserMember(true); setUserRole(data.role); }
    else { setIsUserMember(false); setUserRole(null); }
  }, [user, communityId]);

  const loadMembers = useCallback(async () => {
    if (!communityId) return;
    const { data } = await supabase
      .from('community_members')
      .select('*, profiles(*)')
      .eq('community_id', communityId);
    if (data) setMembers(data as CommunityMemberWithProfile[]);
  }, [communityId]);

  const loadWhispers = useCallback(async () => {
    if (!communityId) return;
    const { data } = await supabase
      .from('whispers')
      .select('*, profiles(*), reactions(*)')
      .eq('community_id', communityId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (data) {
      const ids = data.map(w => w.id);
      const { data: commentData } = await supabase.from('comments').select('whisper_id').in('whisper_id', ids);
      const countMap = new Map<string, number>();
      commentData?.forEach((c: any) => countMap.set(c.whisper_id, (countMap.get(c.whisper_id) || 0) + 1));
      setWhispers(data.map((w: any) => ({ ...w, comment_count: countMap.get(w.id) || 0 })));
    }
  }, [communityId]);

  const loadCollaborations = useCallback(async () => {
    if (!communityId) return;
    const { data } = await supabase
      .from('community_collaborations')
      .select('*, profiles(*)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });
    if (data) setCollaborations(data as any[]);
  }, [communityId]);

  const loadFeatured = useCallback(async () => {
    if (!communityId) return;
    const { data } = await supabase
      .from('community_featured')
      .select('*, profiles(*)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });
    if (data) setFeatured(data as any[]);
  }, [communityId]);

  const loadEvents = useCallback(async () => {
    if (!communityId) return;
    const { data } = await supabase
      .from('community_events')
      .select('*, profiles(*)')
      .eq('community_id', communityId)
      .order('start_date', { ascending: true });
    if (data) setEvents(data as any[]);
  }, [communityId]);

  useEffect(() => {
    if (!communityId) return;
    const load = async () => {
      setIsLoading(true);
      await Promise.all([
        loadCommunity(),
        checkMembership(),
        loadMembers(),
        loadWhispers(),
        loadCollaborations(),
        loadFeatured(),
        loadEvents()
      ]);
      setIsLoading(false);
    };
    load();
  }, [communityId, loadCommunity, checkMembership, loadMembers, loadWhispers, loadCollaborations, loadFeatured, loadEvents]);

  // Reload active tab specific contents dynamically
  useEffect(() => {
    if (!communityId) return;
    if (activeTab === 'feed') loadWhispers();
    if (activeTab === 'collaborations') loadCollaborations();
    if (activeTab === 'featured') loadFeatured();
    if (activeTab === 'events') loadEvents();
    if (activeTab === 'members') loadMembers();
  }, [activeTab, communityId, loadWhispers, loadCollaborations, loadFeatured, loadEvents, loadMembers]);

  useEffect(() => {
    if (!community || !communityId) return;
    track({ eventType: 'community_visit', targetType: 'community', targetId: communityId, communityId, interests: [community.interest] });
  }, [community, communityId, track]);

  const handleJoinLeave = async () => {
    if (!user || !communityId) return;
    setIsJoining(true);
    try {
      if (isUserMember) {
        await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', user.id);
      } else {
        await supabase.from('community_members').insert({ community_id: communityId, user_id: user.id, role: 'member' });
      }
      await Promise.all([checkMembership(), loadMembers()]);
    } catch {
      showToast('Failed to update membership', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!isAdmin) return;
    await supabase.from('community_members').update({ role: newRole }).eq('id', memberId);
    setEditingRoleId(null);
    await loadMembers();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) return;
    const { error } = await supabase.from('community_members').delete().eq('id', memberId);
    if (!error) {
      showToast('Member removed', 'success');
      await loadMembers();
    } else {
      showToast('Failed to remove member', 'error');
    }
  };

  const handleApplyCollaboration = async (role: string, title: string, creatorId: string, creatorUsername: string) => {
    if (!user) return;
    if (user.id === creatorId) {
      showToast("You cannot apply to your own recruitment request.", "info");
      return;
    }

    try {
      const { data: existingParticipant } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      let existingConvId = null;
      if (existingParticipant && existingParticipant.length > 0) {
        const convIds = existingParticipant.map(p => p.conversation_id);
        const { data: commonPart } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('user_id', creatorId);
        if (commonPart && commonPart.length > 0) {
          const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', commonPart[0].conversation_id)
            .eq('type', 'dm')
            .maybeSingle();
          if (conv) {
            existingConvId = conv.id;
          }
        }
      }

      let convId = existingConvId;
      if (!convId) {
        const { data: newConv, error: newConvError } = await supabase
          .from('conversations')
          .insert({ type: 'dm' })
          .select('id')
          .single();

        if (newConvError) throw newConvError;
        convId = newConv.id;

        await supabase.from('conversation_participants').insert([
          { conversation_id: convId, user_id: user.id },
          { conversation_id: convId, user_id: creatorId }
        ]);
      }

      const appMsg = `Hi! I'd like to apply to your collaboration recruitment posting for "${role}" on the project "${title}".`;
      await supabase.from('messages').insert({
        conversation_id: convId,
        content: appMsg
      });

      await supabase.from('notifications').insert({
        user_id: creatorId,
        actor_id: user.id,
        type: 'collaboration_application',
        reference_id: communityId || null
      });

      showToast("Successfully applied! A message has been sent to the creator.", "success");
      navigate(`/messages/${convId}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to apply to collaboration.", "error");
    }
  };

  const handleAddCollaboration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !communityId) return;
    try {
      const { error } = await supabase.from('community_collaborations').insert({
        community_id: communityId,
        user_id: user.id,
        role_needed: collabForm.role_needed,
        title: collabForm.title,
        description: collabForm.description,
      });
      if (error) throw error;
      showToast('Collaboration posting created!', 'success');
      setShowAddCollab(false);
      setCollabForm({ role_needed: 'writer', title: '', description: '' });
      loadCollaborations();
    } catch {
      showToast('Failed to create collaboration posting', 'error');
    }
  };

  const handleAddFeatured = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !communityId) return;
    try {
      const { error } = await supabase.from('community_featured').insert({
        community_id: communityId,
        user_id: user.id,
        asset_type: featuredForm.asset_type,
        asset_id: featuredForm.asset_id || '00000000-0000-0000-0000-000000000000',
        title: featuredForm.title,
        description: featuredForm.description,
      });
      if (error) throw error;
      showToast('Creation featured!', 'success');
      setShowAddFeatured(false);
      setFeaturedForm({ asset_type: 'character', title: '', description: '', asset_id: '' });
      loadFeatured();
    } catch (e: any) {
      showToast('Failed to feature creation: ' + e.message, 'error');
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !communityId) return;
    try {
      const { error } = await supabase.from('community_events').insert({
        community_id: communityId,
        title: eventForm.title,
        description: eventForm.description,
        event_type: eventForm.event_type,
        start_date: new Date(eventForm.start_date).toISOString(),
        end_date: new Date(eventForm.end_date).toISOString(),
        created_by: user.id,
      });
      if (error) throw error;
      showToast('Community event created!', 'success');
      setShowAddEvent(false);
      setEventForm({ title: '', description: '', event_type: 'writing_challenge', start_date: '', end_date: '' });
      loadEvents();
    } catch {
      showToast('Failed to create event', 'error');
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community || userRole !== 'owner') return;
    setDeletingCommunity(true);
    try {
      await supabase.from('community_members').delete().eq('community_id', community.id);
      await supabase.from('whispers').update({ community_id: null }).eq('community_id', community.id);
      const { error } = await supabase.from('communities').delete().eq('id', community.id);
      if (error) throw error;
      showToast('Community deleted', 'success');
      navigate('/communities');
    } catch {
      showToast('Failed to delete community', 'error');
      setDeletingCommunity(false);
    }
  };

  const handleSaveRules = async () => {
    if (!community || !isAdmin) return;
    setSavingRules(true);
    const rules = rulesText.split('\n').map(r => r.trim()).filter(Boolean);
    const { error } = await supabase.from('communities').update({ rules }).eq('id', community.id);
    if (!error) {
      setCommunity(prev => prev ? { ...prev, rules } : prev);
      showToast('Rules saved', 'success');
      setEditingRules(false);
    } else {
      showToast('Failed to save rules', 'error');
    }
    setSavingRules(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !communityId || !isAdmin) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }

    setUploadingBanner(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${communityId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('community-banners').upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('community-banners').getPublicUrl(path);
      await supabase.from('communities').update({ banner_url: data.publicUrl }).eq('id', communityId);
      setCommunity(prev => prev ? { ...prev, banner_url: data.publicUrl } : prev);
      showToast('Banner updated', 'success');
    } catch {
      showToast('Failed to upload banner', 'error');
    } finally {
      setUploadingBanner(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="page-container text-center py-16">
        <p className="text-warm-500 mb-4">Community not found</p>
        <button onClick={() => navigate('/communities')} className="btn-primary">Back to Communities</button>
      </div>
    );
  }

  const roleLabel = (role: string) => {
    const labels: Record<string, { emoji: string; color: string }> = {
      owner: { emoji: '👑', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
      admin: { emoji: '🛡️', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
      moderator: { emoji: '📛', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
      member: { emoji: '', color: 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300' },
    };
    return labels[role] || labels.member;
  };

  return (
    <div className="page-container pb-8">
      {/* Back */}
      <button onClick={() => navigate('/communities')} className="flex items-center gap-2 mb-4 text-sm text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100 transition-colors">
        <ArrowLeft size={18} />
        Communities
      </button>

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6 group">
        {community.banner_url ? (
          <div className="h-40 sm:h-52 bg-cover bg-center" style={{ backgroundImage: `url(${community.banner_url})` }} />
        ) : (
          <div className="h-40 sm:h-52 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 flex items-center justify-center">
            <span className="text-7xl opacity-50">{community.emoji}</span>
          </div>
        )}

        {isAdmin && (
          <>
            <input type="file" ref={bannerInputRef} accept="image/*" onChange={handleBannerUpload} className="hidden" />
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
            >
              {uploadingBanner ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
              {uploadingBanner ? 'Uploading...' : 'Change Banner'}
            </button>
          </>
        )}

        {community.is_featured && (
          <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Featured</span>
        )}
      </div>

      {/* Community Info */}
      <div className="flex items-start gap-4 mb-6">
        <span className="text-5xl">{community.emoji}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">{community.name}</h1>
          <p className="text-warm-600 dark:text-warm-300 text-sm mt-1">{community.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium">
              {community.interest}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400">
              {community.category}
            </span>
            <span className="text-xs text-warm-500">{members.length} member{members.length !== 1 ? 's' : ''}</span>
            <span className="text-xs text-warm-500">{community.post_count || 0} post{(community.post_count || 0) !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {userRole === 'owner' ? (
          <button
            onClick={() => setActiveTab('manage')}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm bg-warm-800 dark:bg-warm-100 text-warm-50 dark:text-warm-900 hover:opacity-90 transition-all"
          >
            <Settings size={14} />
            Manage
          </button>
        ) : (
          <button
            onClick={handleJoinLeave}
            disabled={isJoining}
            className={`flex-shrink-0 px-5 py-2 rounded-full font-semibold text-sm transition-all ${
              isUserMember
                ? 'bg-warm-200 dark:bg-warm-700 text-warm-900 dark:text-warm-50 hover:bg-warm-300'
                : 'btn-primary'
            } disabled:opacity-50`}
          >
            {isJoining ? '…' : isUserMember ? 'Joined' : 'Join'}
          </button>
        )}
      </div>

      {/* Moderators strip */}
      {moderators.length > 0 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          <Shield size={14} className="text-warm-500 flex-shrink-0" />
          <span className="text-xs text-warm-500 flex-shrink-0 font-medium">Mods:</span>
          {moderators.map(m => (
            <button
              key={m.id}
              onClick={() => navigate(`/profile/${m.profiles.username}`)}
              className="flex items-center gap-1.5 bg-warm-100 dark:bg-warm-800 rounded-full px-2.5 py-1 flex-shrink-0 hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors"
            >
              <Avatar emoji={m.profiles.avatar_emoji} photoUrl={m.profiles.photo_url} size="xs" />
              <span className="text-xs font-medium text-warm-700 dark:text-warm-300">{m.profiles.display_name}</span>
              <UserBadges 
                badges={getContextualBadges((m.profiles as any).badges, m.role)} 
                role={(m.profiles as any).role} 
                size="sm" 
              />
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-warm-200 dark:border-warm-700 overflow-x-auto -mx-4 px-4">
        {([
          { key: 'feed' as TabType, label: 'Feed', icon: MessageCircle },
          { key: 'collaborations' as TabType, label: 'Collaboration Hub', icon: Briefcase },
          { key: 'featured' as TabType, label: 'Featured Creations', icon: Globe },
          { key: 'events' as TabType, label: 'Events', icon: Calendar },
          { key: 'members' as TabType, label: 'Members', icon: Users },
          { key: 'rules' as TabType, label: 'Rules', icon: ScrollText },
          ...(isAdmin ? [{ key: 'manage' as TabType, label: 'Manage', icon: Settings }] : []),
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div>
          {isUserMember && (
            <button onClick={() => setShowCompose(true)} className="btn-primary mb-6 w-full sm:w-auto">
              Create Post
            </button>
          )}

          {whispers.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={40} className="mx-auto text-warm-300 dark:text-warm-600 mb-3" />
              <p className="text-warm-500 text-sm">
                {isUserMember ? 'Be the first to post something!' : 'Join this community to see and create posts'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {whispers.map(w => (
                <WhisperCard 
                  key={w.id} 
                  whisper={w} 
                  onWhisperDeleted={loadWhispers} 
                  onReactionChange={loadWhispers} 
                  communityOwnerId={community?.owner_id}
                  communityModerators={moderators.map(m => m.user_id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collaboration Hub Tab */}
      {activeTab === 'collaborations' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white">Collaboration Hub</h3>
              <p className="text-xs text-warm-500">Recruit partners or request help for your creative projects</p>
            </div>
            {isUserMember && (
              <button onClick={() => setShowAddCollab(!showAddCollab)} className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3">
                <Plus size={14} /> Recruit Collaborators
              </button>
            )}
          </div>

          {showAddCollab && (
            <form onSubmit={handleAddCollaboration} className="mb-6 p-5 bg-warm-50 dark:bg-warm-900/60 rounded-2xl border border-warm-200 dark:border-warm-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Role Needed</label>
                <select
                  value={collabForm.role_needed}
                  onChange={e => setCollabForm(prev => ({ ...prev, role_needed: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="writer">Writer</option>
                  <option value="editor">Editor</option>
                  <option value="prompt_engineer">Prompt Engineer</option>
                  <option value="character_designer">Character Designer</option>
                  <option value="worldbuilder">Worldbuilder</option>
                  <option value="lore_writer">Lore Writer</option>
                  <option value="voice_actor">Voice Actor</option>
                  <option value="collaborator">General Collaborator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Project Title</label>
                <input
                  type="text"
                  required
                  value={collabForm.title}
                  onChange={e => setCollabForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Fantasy Novel co-writing"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Description & Requirements</label>
                <textarea
                  required
                  value={collabForm.description}
                  onChange={e => setCollabForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your project, style, and what you are looking for..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddCollab(false)} className="btn-ghost flex-1 py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-2 text-xs">Post Recruitment</button>
              </div>
            </form>
          )}

          {collaborations.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-warm-800 rounded-2xl border border-warm-150 dark:border-warm-850">
              <Briefcase size={36} className="mx-auto text-warm-300 dark:text-warm-650 mb-2" />
              <p className="text-warm-500 text-sm">No active collaboration recruitments yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collaborations.map(collab => (
                <div key={collab.id} className="p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-150 dark:border-warm-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        🔍 {collab.role_needed.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-warm-400">{new Date(collab.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-warm-900 dark:text-white mb-2">{collab.title}</h4>
                    <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-4">{collab.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-warm-100 dark:border-warm-800">
                    <div className="flex items-center gap-2">
                      <Avatar emoji={collab.profiles?.avatar_emoji || '👤'} photoUrl={collab.profiles?.photo_url} size="xs" />
                      <span className="text-xs text-warm-500">by @{collab.profiles?.username}</span>
                    </div>
                    {collab.user_id !== user?.id ? (
                      <button
                        onClick={() => handleApplyCollaboration(collab.role_needed, collab.title, collab.user_id, collab.profiles?.username || '')}
                        className="text-xs btn-primary py-1 px-3"
                      >
                        Apply
                      </button>
                    ) : (
                      <span className="text-xs text-warm-400 font-semibold italic">My Posting</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Featured Creations Tab */}
      {activeTab === 'featured' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white">Featured Creations</h3>
              <p className="text-xs text-warm-500">Showcase creations shared by community members</p>
            </div>
            {isUserMember && (
              <button onClick={() => setShowAddFeatured(!showAddFeatured)} className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3">
                <Plus size={14} /> Feature Creation
              </button>
            )}
          </div>

          {showAddFeatured && (
            <form onSubmit={handleAddFeatured} className="mb-6 p-5 bg-warm-50 dark:bg-warm-900/60 rounded-2xl border border-warm-200 dark:border-warm-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Asset Type</label>
                <select
                  value={featuredForm.asset_type}
                  onChange={e => setFeaturedForm(prev => ({ ...prev, asset_type: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="character">AI Character</option>
                  <option value="story">Story</option>
                  <option value="world">World</option>
                  <option value="lorebook">Lorebook</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Creation Title</label>
                <input
                  type="text"
                  required
                  value={featuredForm.title}
                  onChange={e => setFeaturedForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Elena the Archivist"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Asset ID (Optional UUID from CHIMERA)</label>
                <input
                  type="text"
                  value={featuredForm.asset_id}
                  onChange={e => setFeaturedForm(prev => ({ ...prev, asset_id: e.target.value }))}
                  placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Showcase Teaser/Description</label>
                <textarea
                  required
                  value={featuredForm.description}
                  onChange={e => setFeaturedForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us what makes this creation unique..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddFeatured(false)} className="btn-ghost flex-1 py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-2 text-xs">Feature Item</button>
              </div>
            </form>
          )}

          {featured.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-warm-800 rounded-2xl border border-warm-150 dark:border-warm-850">
              <Globe size={36} className="mx-auto text-warm-300 dark:text-warm-650 mb-2" />
              <p className="text-warm-500 text-sm">No member creations featured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featured.map(item => (
                <div key={item.id} className="p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-150 dark:border-warm-800 shadow-sm flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center text-xl flex-shrink-0">
                    {item.asset_type === 'character' ? '🎭' :
                     item.asset_type === 'story' ? '📖' :
                     item.asset_type === 'world' ? '🗺️' : '📚'}
                  </div>
                  <div>
                    <h4 className="font-bold text-warm-900 dark:text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-primary-500 font-semibold mb-2 capitalize">{item.asset_type}</p>
                    <p className="text-xs text-warm-650 dark:text-warm-350 line-clamp-2 leading-relaxed mb-3">{item.description}</p>
                    <div className="flex items-center gap-2 pt-2 border-t border-warm-100 dark:border-warm-800">
                      <Avatar emoji={item.profiles?.avatar_emoji || '👤'} photoUrl={item.profiles?.photo_url} size="xs" />
                      <span className="text-xs text-warm-450">Featured by @{item.profiles?.username}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Community Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white">Community Events</h3>
              <p className="text-xs text-warm-500">Moderator organized contests, writing weeks, and challenges</p>
            </div>
            {isAdmin && (
              <button onClick={() => setShowAddEvent(!showAddEvent)} className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3">
                <Plus size={14} /> Schedule Event
              </button>
            )}
          </div>

          {showAddEvent && (
            <form onSubmit={handleAddEvent} className="mb-6 p-5 bg-warm-50 dark:bg-warm-900/60 rounded-2xl border border-warm-200 dark:border-warm-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Event Type</label>
                <select
                  value={eventForm.event_type}
                  onChange={e => setEventForm(prev => ({ ...prev, event_type: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="writing_challenge">Writing Challenge</option>
                  <option value="creator_event">Creator Showcase</option>
                  <option value="contest">Contest / Competition</option>
                  <option value="collaboration_week">Collaboration Week</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={e => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Midsummer Lore Contest"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Event Teaser/Rules</label>
                <textarea
                  required
                  value={eventForm.description}
                  onChange={e => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the rules, objectives, and awards..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.start_date}
                    onChange={e => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 uppercase mb-2">End Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.end_date}
                    onChange={e => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddEvent(false)} className="btn-ghost flex-1 py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-2 text-xs">Create Event</button>
              </div>
            </form>
          )}

          {events.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-warm-800 rounded-2xl border border-warm-150 dark:border-warm-850">
              <Calendar size={36} className="mx-auto text-warm-300 dark:text-warm-650 mb-2" />
              <p className="text-warm-500 text-sm">No scheduled events or contests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-150 dark:border-warm-800 shadow-sm flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary-50 text-secondary-500 border border-secondary-100 flex items-center justify-center text-xl flex-shrink-0">
                    🏆
                  </div>
                  <div>
                    <span className="text-xs bg-secondary-150 text-secondary-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {event.event_type.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-warm-900 dark:text-white text-base mt-2 mb-1">{event.title}</h4>
                    <p className="text-xs text-warm-500 mb-3">
                      📅 {new Date(event.start_date).toLocaleString()} — {new Date(event.end_date).toLocaleString()}
                    </p>
                    <p className="text-sm text-warm-650 dark:text-warm-350 leading-relaxed mb-1">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-center text-warm-500 py-12">No members yet</p>
          ) : (
            members.map(member => {
              const rl = roleLabel(member.role);
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700">
                  <button onClick={() => navigate(`/profile/${member.profiles.username}`)} className="flex-shrink-0">
                    <Avatar emoji={member.profiles.avatar_emoji} photoUrl={member.profiles.photo_url} size="md" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-warm-900 dark:text-warm-50 text-sm truncate flex items-center">
                      {member.profiles.display_name}
                      <UserBadges 
                        badges={getContextualBadges((member.profiles as any).badges, member.role)} 
                        role={(member.profiles as any).role} 
                        size="sm" 
                      />
                    </p>
                    <p className="text-xs text-warm-500 truncate">@{member.profiles.username}</p>
                  </div>

                  {editingRoleId === member.id && isAdmin ? (
                    <select
                      onChange={e => handleChangeRole(member.id, e.target.value)}
                      onBlur={() => setEditingRoleId(null)}
                      autoFocus
                      className="text-xs px-2 py-1 rounded-full bg-warm-100 dark:bg-warm-700 border border-warm-300 dark:border-warm-600"
                      defaultValue={member.role}
                    >
                      <option value="member">Member</option>
                      <option value="moderator">Moderator</option>
                      {userRole === 'owner' && <option value="admin">Admin</option>}
                    </select>
                  ) : (
                    <button
                      onClick={() => isAdmin && setEditingRoleId(member.id)}
                      disabled={!isAdmin}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${rl.color} ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                    >
                      {rl.emoji} {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          {(!community.rules || community.rules.length === 0) ? (
            <div className="text-center py-12">
              <ScrollText size={40} className="mx-auto text-warm-300 dark:text-warm-600 mb-3" />
              <p className="text-warm-500 text-sm">No community rules have been set yet.</p>
              {isAdmin && <p className="text-xs text-warm-400 mt-1">Rules can be added by editing the community.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {community.rules.map((rule, idx) => (
                <div key={idx} className="flex gap-3 p-4 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-warm-800 dark:text-warm-200 pt-0.5">{rule}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage Tab — owners & admins only */}
      {activeTab === 'manage' && isAdmin && (
        <div className="space-y-6">
          {/* Community Analytics */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={18} className="text-primary-500" />
              <h3 className="font-semibold text-warm-900 dark:text-warm-50">Analytics</h3>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { label: 'Members', value: members.length },
                { label: 'Posts', value: community.post_count || 0 },
                { label: 'Moderators', value: moderators.length },
                { label: 'Rules', value: community.rules?.length || 0 },
              ].map(stat => (
                <div key={stat.label} className="bg-warm-50 dark:bg-warm-700/50 rounded-2xl p-3 text-center">
                  <dd className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stat.value}</dd>
                  <dt className="text-xs text-warm-500 mt-0.5">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Rules Editor */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ScrollText size={18} className="text-primary-500" />
                <h3 className="font-semibold text-warm-900 dark:text-warm-50">Community Rules</h3>
              </div>
              {!editingRules && (
                <button
                  onClick={() => { setRulesText((community.rules || []).join('\n')); setEditingRules(true); }}
                  className="text-xs btn-ghost py-1 px-3"
                >
                  Edit
                </button>
              )}
            </div>
            {editingRules ? (
              <div className="space-y-3">
                <p className="text-xs text-warm-500">Enter one rule per line.</p>
                <textarea
                  value={rulesText}
                  onChange={e => setRulesText(e.target.value)}
                  className="input-field resize-none"
                  rows={6}
                  placeholder="Be respectful to everyone\nNo spam or self-promotion"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingRules(false)} className="btn-ghost flex-1 py-2">Cancel</button>
                  <button onClick={handleSaveRules} disabled={savingRules} className="btn-primary flex-1 py-2">
                    {savingRules ? 'Saving…' : 'Save Rules'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {(!community.rules || community.rules.length === 0) ? (
                  <p className="text-sm text-warm-500">No rules set. Click Edit to add community rules.</p>
                ) : community.rules.map((rule, i) => (
                  <div key={i} className="flex gap-3 items-start text-sm text-warm-700 dark:text-warm-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">{i+1}</span>
                    {rule}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Member Management */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-primary-500" />
              <h3 className="font-semibold text-warm-900 dark:text-warm-50">Member Management</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.map(member => {
                const isOwnerRecord = member.role === 'owner';
                const rl = roleLabel(member.role);
                return (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-warm-50 dark:bg-warm-700/50">
                    <button onClick={() => navigate(`/profile/${member.profiles.username}`)} className="flex-shrink-0">
                      <Avatar emoji={member.profiles.avatar_emoji} photoUrl={member.profiles.photo_url} size="sm" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-900 dark:text-warm-50 truncate">{member.profiles.display_name}</p>
                      <p className="text-xs text-warm-500">@{member.profiles.username}</p>
                    </div>
                    {editingRoleId === member.id ? (
                      <select
                        onChange={e => handleChangeRole(member.id, e.target.value)}
                        onBlur={() => setEditingRoleId(null)}
                        autoFocus
                        className="text-xs px-2 py-1 rounded-full bg-warm-100 dark:bg-warm-600 border border-warm-300 dark:border-warm-500"
                        defaultValue={member.role}
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                        {userRole === 'owner' && <option value="admin">Admin</option>}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rl.color} cursor-pointer hover:opacity-80`}
                        onClick={() => !isOwnerRecord && setEditingRoleId(member.id)}>
                        {rl.emoji} {member.role}
                      </span>
                    )}
                    {!isOwnerRecord && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-warm-400 hover:text-error-500 transition-colors rounded-lg hover:bg-error-50 dark:hover:bg-error-900/30"
                        aria-label="Remove member"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone — owner only */}
          {userRole === 'owner' && (
            <div className="card border border-error-200 dark:border-error-800">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-error-500" />
                <h3 className="font-semibold text-error-700 dark:text-error-400">Danger Zone</h3>
              </div>
              <p className="text-sm text-warm-600 dark:text-warm-400 mb-4">
                Deleting this community is permanent and cannot be undone. All posts will be disassociated from the community.
              </p>
              {showDeleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-error-700 dark:text-error-400">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
                    <button
                      onClick={handleDeleteCommunity}
                      disabled={deletingCommunity}
                      className="btn-danger flex-1 py-2 text-sm"
                    >
                      {deletingCommunity ? 'Deleting…' : 'Delete Community'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-danger py-2 px-4 text-sm"
                >
                  <Trash2 size={14} className="inline mr-1.5" />
                  Delete Community
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <ComposeWhisper
          onClose={() => setShowCompose(false)}
          onWhisperCreated={() => { setShowCompose(false); loadWhispers(); }}
          communityId={community.id}
        />
      )}
    </div>
  );
}
