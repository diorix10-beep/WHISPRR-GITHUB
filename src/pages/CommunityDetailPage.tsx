import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Users, Shield, ScrollText,
  Image as ImageIcon, Loader2, X
} from 'lucide-react';
import type { Community, CommunityMember, Profile, Whisper, Reaction } from '../types';
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

type TabType = 'posts' | 'members' | 'rules' | 'about';

export default function CommunityDetailPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track } = useInterests();
  const { showToast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMemberWithProfile[]>([]);
  const [whispers, setWhispers] = useState<WhisperWithRelations[]>([]);
  const [isUserMember, setIsUserMember] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'moderator' | 'member' | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!communityId) return;
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadCommunity(), checkMembership(), loadMembers(), loadWhispers()]);
      setIsLoading(false);
    };
    load();
  }, [communityId, loadCommunity, checkMembership, loadMembers, loadWhispers]);

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
        <button
          onClick={handleJoinLeave}
          disabled={isJoining}
          className={`flex-shrink-0 px-5 py-2 rounded-full font-semibold text-sm transition-all ${
            isUserMember
              ? 'bg-warm-200 dark:bg-warm-700 text-warm-900 dark:text-warm-50 hover:bg-warm-300'
              : 'btn-primary'
          } disabled:opacity-50`}
        >
          {isJoining ? '...' : isUserMember ? (userRole === 'owner' ? 'Owner' : 'Joined') : 'Join'}
        </button>
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
              <UserBadges badges={(m.profiles as any).badges} size="sm" />
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-warm-200 dark:border-warm-700 overflow-x-auto -mx-4 px-4">
        {([
          { key: 'posts' as TabType, label: 'Posts', icon: MessageCircle },
          { key: 'members' as TabType, label: 'Members', icon: Users },
          { key: 'rules' as TabType, label: 'Rules', icon: ScrollText },
          { key: 'about' as TabType, label: 'About', icon: Shield },
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

      {/* Posts Tab */}
      {activeTab === 'posts' && (
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
                <WhisperCard key={w.id} whisper={w} onWhisperDeleted={loadWhispers} onReactionChange={loadWhispers} />
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
                      <UserBadges badges={(member.profiles as any).badges} size="sm" />
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

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700">
            <h3 className="font-semibold text-warm-900 dark:text-warm-50 text-sm mb-2">About</h3>
            <p className="text-sm text-warm-600 dark:text-warm-400">{community.description || 'No description provided.'}</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700">
            <h3 className="font-semibold text-warm-900 dark:text-warm-50 text-sm mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-warm-500">Category</dt>
                <dd className="text-warm-900 dark:text-warm-100 font-medium">{community.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-500">Interest</dt>
                <dd className="text-warm-900 dark:text-warm-100 font-medium">{community.interest}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-500">Members</dt>
                <dd className="text-warm-900 dark:text-warm-100 font-medium">{members.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-500">Posts</dt>
                <dd className="text-warm-900 dark:text-warm-100 font-medium">{community.post_count || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-500">Created</dt>
                <dd className="text-warm-900 dark:text-warm-100 font-medium">{new Date(community.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          {moderators.length > 0 && (
            <div className="p-4 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700">
              <h3 className="font-semibold text-warm-900 dark:text-warm-50 text-sm mb-3">Moderation Team</h3>
              <div className="space-y-2">
                {moderators.map(m => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/profile/${m.profiles.username}`)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-warm-50 dark:hover:bg-warm-700 transition-colors text-left"
                  >
                    <Avatar emoji={m.profiles.avatar_emoji} photoUrl={m.profiles.photo_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-900 dark:text-warm-50 truncate flex items-center">
                        {m.profiles.display_name}
                        <UserBadges badges={(m.profiles as any).badges} size="sm" />
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleLabel(m.role).color}`}>
                      {roleLabel(m.role).emoji} {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
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
