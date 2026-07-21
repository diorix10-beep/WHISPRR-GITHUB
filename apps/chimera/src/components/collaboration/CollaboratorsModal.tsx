import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, X, Search, Shield, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../common/Avatar';
import type { Profile } from '../../types';

interface Collaborator {
  id: string;
  project_id: string;
  project_type: string;
  user_id: string;
  role: 'editor' | 'viewer';
  invited_by: string;
  profile?: Profile;
}

interface CollaboratorsModalProps {
  projectId: string;
  projectType: 'story' | 'world' | 'character';
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CollaboratorsModal({
  projectId,
  projectType,
  projectTitle,
  isOpen,
  onClose,
}: CollaboratorsModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Invite State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchCollaborators();
    }
  }, [isOpen, projectId]);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select('*, profile:profiles!project_collaborators_user_id_fkey(*)')
        .eq('project_id', projectId)
        .eq('project_type', projectType);

      if (error) {
        // If table does not exist yet in Supabase, handle gracefully
        console.warn('Could not fetch collaborators (table may be pending migration):', error);
        setCollaborators([]);
      } else {
        setCollaborators(data || []);
      }
    } catch (err) {
      console.error('Error fetching collaborators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user?.id)
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(5);

      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching profiles:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleInviteCollaborator = async (targetUser: Profile) => {
    if (!user) return;
    setInvitingId(targetUser.user_id);
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          project_type: projectType,
          user_id: targetUser.user_id,
          role: 'editor',
          invited_by: user.id
        });

      if (error) throw error;
      showToast(`Invited ${targetUser.display_name} as a co-creator!`, 'success');
      setSearchQuery('');
      setSearchResults([]);
      fetchCollaborators();
    } catch (err: any) {
      console.error('Error inviting collaborator:', err);
      showToast(err.message || 'Failed to add collaborator', 'error');
    } finally {
      setInvitingId(null);
    }
  };

  const handleRemoveCollaborator = async (collabId: string) => {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collabId);

      if (error) throw error;
      setCollaborators(collaborators.filter(c => c.id !== collabId));
      showToast('Removed collaborator', 'success');
    } catch (err: any) {
      console.error('Error removing collaborator:', err);
      showToast('Failed to remove collaborator', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-bold text-white text-base">Co-Creators</h3>
              <p className="text-xs text-white/50 truncate max-w-[200px]">{projectTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          
          {/* Invite User Input */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Invite Co-Creator</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search username or display name..."
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-[#1A1A1E] border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
                {searchResults.map(p => {
                  const alreadyAdded = collaborators.some(c => c.user_id === p.user_id);
                  return (
                    <div key={p.user_id} className="p-2.5 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar emoji={p.avatar_emoji} photoUrl={p.photo_url} size="xs" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{p.display_name}</p>
                          <p className="text-[10px] text-white/40 truncate">@{p.username}</p>
                        </div>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-[10px] bg-white/10 text-white/50 px-2 py-1 rounded-md">Added</span>
                      ) : (
                        <button
                          onClick={() => handleInviteCollaborator(p)}
                          disabled={invitingId === p.user_id}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                          {invitingId === p.user_id ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                          Invite
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Collaborators List */}
          <div>
            <h4 className="text-xs font-semibold text-white/70 mb-2">Active Collaborators ({collaborators.length})</h4>
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-4 bg-white/5 rounded-xl border border-white/5">
                No co-creators added yet. Search above to invite creators to collaborate!
              </p>
            ) : (
              <div className="space-y-2">
                {collaborators.map(c => (
                  <div key={c.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar emoji={c.profile?.avatar_emoji} photoUrl={c.profile?.photo_url} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {c.profile?.display_name || 'Creator'}
                        </p>
                        <span className="inline-block text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-medium mt-0.5">
                          {c.role}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCollaborator(c.id)}
                      className="p-1.5 text-white/40 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Remove Collaborator"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
