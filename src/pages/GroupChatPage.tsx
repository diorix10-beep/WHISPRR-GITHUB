import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, X, Check } from 'lucide-react';
import type { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';

interface FollowedUser extends Profile {
  is_selected?: boolean;
}

export default function GroupChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'name' | 'participants'>('name');
  const [groupName, setGroupName] = useState('');
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch followed users
  useEffect(() => {
    const fetchFollowedUsers = async () => {
      if (!user) return;

      try {
        setFetchingUsers(true);
        // First get the list of following_ids
        const { data: follows, error: followsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (followsError) throw followsError;

        const followingIds = (follows || []).map(f => f.following_id);

        if (followingIds.length === 0) {
          setFollowedUsers([]);
          setFetchingUsers(false);
          return;
        }

        // Then fetch the profiles of those users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', followingIds);

        if (profilesError) throw profilesError;

        setFollowedUsers(profiles || []);
      } catch (err) {
        console.error('Error fetching followed users:', err);
        setError('Failed to load followed users');
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchFollowedUsers();
  }, [user]);

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleNext = () => {
    if (!groupName.trim()) {
      setError('Please enter a group chat name');
      return;
    }
    setError(null);
    setStep('participants');
  };

  const handleCreateGroupChat = async () => {
    if (!user || selectedUsers.size === 0) {
      setError('Please select at least one participant');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Create conversation
      const { data: conversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name: groupName.trim(),
          created_by: user.id,
        })
        .select()
        .maybeSingle();

      if (createError) throw createError;

      if (!conversation) {
        throw new Error('Failed to create conversation');
      }

      // Add all participants to conversation_participants
      const participantIds = [user.id, ...Array.from(selectedUsers)];
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(
          participantIds.map(userId => ({
            conversation_id: conversation.id,
            user_id: userId,
          }))
        );

      if (participantsError) throw participantsError;

      // Update conversation with group name
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_message: groupName.trim() })
        .eq('id', conversation.id);

      if (updateError) throw updateError;

      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error creating group chat:', err);
      setError('Failed to create group chat. Please try again.');
      setCreating(false);
    }
  };

  // Name Step
  if (step === 'name') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white dark:bg-warm-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md mx-4 max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-warm-800 border-b border-warm-200 dark:border-warm-700 p-4 flex items-center justify-between rounded-t-3xl">
            <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-100">
              New Group Chat
            </h2>
            <button
              onClick={() => navigate('/messages')}
              className="btn-ghost p-2"
            >
              <X size={24} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
            className="p-4 space-y-4"
          >
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
                Group Chat Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g., Book Club, Weekend Plans"
                className="input-field"
                autoFocus
              />
              <p className="text-xs text-warm-500 mt-1">
                This is the name of your group chat
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/messages')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={!groupName.trim()}
              >
                Next
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Participants Step
  if (step === 'participants') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white dark:bg-warm-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md mx-4 max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-warm-800 border-b border-warm-200 dark:border-warm-700 p-4 flex items-center justify-between rounded-t-3xl">
            <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-100">
              {groupName}
            </h2>
            <button
              onClick={() => navigate('/messages')}
              className="btn-ghost p-2"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-3">
                Select Participants ({selectedUsers.size})
              </label>

              {fetchingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-primary-500" />
                </div>
              ) : followedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-warm-600 dark:text-warm-400">
                    You haven't followed anyone yet
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/discover')}
                    className="btn-primary mt-4 py-2 px-6 inline-block"
                  >
                    Discover Users
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {followedUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUserSelection(user.user_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors ${
                        selectedUsers.has(user.user_id)
                          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                          : 'hover:bg-warm-100 dark:hover:bg-warm-700'
                      }`}
                    >
                      <Avatar
                        emoji={user.avatar_emoji}
                        photoUrl={user.photo_url}
                        size="md"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-warm-900 dark:text-warm-100">
                          {user.display_name}
                        </p>
                        <p className="text-sm text-warm-600 dark:text-warm-400">
                          @{user.username}
                        </p>
                      </div>
                      {selectedUsers.has(user.user_id) && (
                        <Check size={20} className="text-primary-600 dark:text-primary-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('name');
                }}
                className="btn-secondary flex-1"
                disabled={creating}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateGroupChat}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={creating || selectedUsers.size === 0}
              >
                {creating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
