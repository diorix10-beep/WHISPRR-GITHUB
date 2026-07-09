import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, X, Check, Users, AlertTriangle, ChevronLeft, Search } from 'lucide-react';
import type { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';
import { validateRequired } from '../lib/validation';

interface FollowedUser extends Profile {
  is_selected?: boolean;
}

const MAX_GROUP_NAME = 50;
const MAX_PARTICIPANTS = 50;

export default function GroupChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<'name' | 'participants'>('name');
  const [groupName, setGroupName] = useState('');
  const [nameError, setNameError] = useState('');
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFollowedUsers = useCallback(async () => {
    if (!user) return;
    setFetchingUsers(true);
    setFetchError(null);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(50);
      
      if (profilesError) throw profilesError;
      setFollowedUsers(profiles || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setFetchError('Failed to load users. Please try again.');
    } finally {
      setFetchingUsers(false);
    }
  }, [user]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!user) return;
    
    if (query.trim() === '') {
      fetchFollowedUsers();
      return;
    }
    
    setFetchingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('user_id', user.id)
        .limit(20);
      if (error) throw error;
      setFollowedUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    fetchFollowedUsers();
  }, [fetchFollowedUsers]);

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.size >= MAX_PARTICIPANTS && !selectedUsers.has(userId)) {
      showToast(`Max ${MAX_PARTICIPANTS} participants`, 'error');
      return;
    }
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) newSelected.delete(userId);
    else newSelected.add(userId);
    setSelectedUsers(newSelected);
  };

  const handleNext = () => {
    const v = validateRequired(groupName, 'Group name');
    if (!v.valid) { setNameError(v.error!); return; }
    if (groupName.trim().length > MAX_GROUP_NAME) { setNameError(`Group name cannot exceed ${MAX_GROUP_NAME} characters`); return; }
    setNameError('');
    setStep('participants');
  };

  const handleCreateGroupChat = async () => {
    if (!user || selectedUsers.size === 0) {
      setCreateError('Please select at least one participant');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const { data: conversation, error: createErr } = await supabase
        .from('conversations')
        .insert({ type: 'group', name: groupName.trim(), created_by: user.id })
        .select()
        .maybeSingle();

      if (createErr) throw createErr;
      if (!conversation) throw new Error('Failed to create group chat — please try again.');

      const participantIds = [user.id, ...Array.from(selectedUsers)];
      const { error: participantsErr } = await supabase
        .from('conversation_participants')
        .insert(participantIds.map(uid => ({ conversation_id: conversation.id, user_id: uid })));
      if (participantsErr) throw participantsErr;

      showToast(`"${groupName.trim()}" created!`, 'success');
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error creating group chat:', err);
      setCreateError(err instanceof Error ? err.message : 'Failed to create group chat. Please try again.');
      setCreating(false);
    }
  };

  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-warm-800 border border-warm-100 dark:border-warm-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-float animate-scale-in">
        {children}
      </div>
    </div>
  );

  const ModalHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-warm-100 dark:border-warm-700 flex-shrink-0">
      {step === 'participants' && (
        <button onClick={() => { setCreateError(null); setStep('name'); }} className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full" aria-label="Back">
          <ChevronLeft size={20} className="text-warm-600 dark:text-warm-400" />
        </button>
      )}
      <div className="flex items-center gap-2 flex-1">
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
          <Users size={16} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-100">{title}</h2>
      </div>
      <button onClick={() => navigate('/messages')} className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full" aria-label="Close">
        <X size={20} className="text-warm-500" />
      </button>
    </div>
  );

  if (step === 'name') {
    return (
      <Modal>
        <ModalHeader title="New Group Chat" />
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="p-5 space-y-4 overflow-y-auto">
          {nameError && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-2xl p-3 text-sm text-error-700 dark:text-error-400 flex items-center gap-2">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {nameError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2" htmlFor="group-name">
              Group Chat Name
            </label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={e => { setGroupName(e.target.value); if (nameError) setNameError(''); }}
              placeholder="e.g., Book Club, Weekend Plans"
              className={`input-field ${nameError ? 'input-field-error' : ''}`}
              maxLength={MAX_GROUP_NAME}
              autoFocus
            />
            <div className="flex justify-between mt-1.5">
              <p className="input-helper">Give your group a memorable name</p>
              <span className={`text-xs tabular-nums ${groupName.length > MAX_GROUP_NAME * 0.8 ? 'text-warning-600' : 'text-warm-400'}`}>
                {groupName.length}/{MAX_GROUP_NAME}
              </span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/messages')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={!groupName.trim()}>
              Next →
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal>
      <ModalHeader title={groupName} />
      <div className="p-5 space-y-4 overflow-y-auto flex-1 flex flex-col min-h-0">
        {createError && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-2xl p-3 text-sm text-error-700 dark:text-error-400 flex items-center gap-2">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>{createError}</span>
            <button onClick={fetchFollowedUsers} className="ml-auto text-primary-600 dark:text-primary-400 underline text-xs">Retry</button>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-warm-700 dark:text-warm-300">
              Select Participants
            </label>
            <span className="text-xs text-warm-500">{selectedUsers.size} selected</span>
          </div>

          {/* Search bar */}
          <div className="relative flex-shrink-0">
            <Search size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-warm-400" />
            <input
              type="text"
              placeholder="Search by username or display name..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            {fetchError ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-warm-600 dark:text-warm-400">{fetchError}</p>
                <button onClick={fetchFollowedUsers} className="btn-primary py-2 px-5 text-sm">Try Again</button>
              </div>
            ) : fetchingUsers ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={22} className="animate-spin text-primary-500" />
              </div>
            ) : followedUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-warm-600 dark:text-warm-400 text-sm">No users found.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {followedUsers.map(u => {
                  const isSelected = selectedUsers.has(u.user_id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUserSelection(u.user_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/25 border border-primary-200 dark:border-primary-700'
                          : 'hover:bg-warm-100 dark:hover:bg-warm-700 border border-transparent'
                      }`}
                    >
                      <Avatar emoji={u.avatar_emoji} photoUrl={u.photo_url} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-warm-900 dark:text-warm-100 text-sm truncate">{u.display_name}</p>
                        <p className="text-xs text-warm-500">@{u.username}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'bg-primary-500 border-primary-500' : 'border-warm-300 dark:border-warm-600'
                      }`}>
                        {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-warm-100 dark:border-warm-700 flex gap-3 flex-shrink-0">
        <button type="button" onClick={() => { setCreateError(null); setStep('name'); }} className="btn-secondary flex-1" disabled={creating}>
          Back
        </button>
        <button
          type="button"
          onClick={handleCreateGroupChat}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          disabled={creating || selectedUsers.size === 0}
        >
          {creating ? (<><Loader2 size={16} className="animate-spin" />Creating…</>) : 'Create Group'}
        </button>
      </div>
    </Modal>
  );
}
