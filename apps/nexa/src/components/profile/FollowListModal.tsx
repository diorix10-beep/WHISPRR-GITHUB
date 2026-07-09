import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { Profile } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string; // auth.users.id (user_id on profiles)
  type: 'followers' | 'following';
}

export function FollowListModal({ isOpen, onClose, userId, type }: FollowListModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;

    const fetchFollowList = async () => {
      setLoading(true);
      try {
        let userIds: string[] = [];

        if (type === 'followers') {
          const { data } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);
          userIds = data?.map(f => f.follower_id) ?? [];
        } else {
          const { data } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);
          userIds = data?.map(f => f.following_id) ?? [];
        }

        if (userIds.length === 0) {
          setProfiles([]);
          setFollowing(new Set());
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        const fetched = profileData ?? [];
        setProfiles(fetched);

        if (user && fetched.length > 0) {
          const { data: followingData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .in('following_id', fetched.map(p => p.user_id));

          setFollowing(new Set(followingData?.map(f => f.following_id) ?? []));
        }
      } catch (err) {
        console.error('Error fetching follow list:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowList();
  }, [isOpen, userId, type, user]);

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) return;

    try {
      if (following.has(targetUserId)) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        setFollowing(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        setFollowing(prev => new Set([...prev, targetUserId]));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-xl w-full max-w-md max-h-96 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-warm-200 dark:border-warm-700">
          <h2 className="font-serif text-lg font-semibold text-warm-900 dark:text-warm-50">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-300 border-t-primary-500" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-warm-600 dark:text-warm-400">No {type} yet</p>
            </div>
          ) : (
            <div className="divide-y divide-warm-200 dark:divide-warm-700">
              {profiles.map(p => (
                <div
                  key={p.user_id}
                  className="p-4 flex items-center gap-3 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                >
                  <Avatar emoji={p.avatar_emoji} photoUrl={p.photo_url} size="md" />
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => { navigate(`/profile/${p.username}`); onClose(); }}
                  >
                    <h3 className="font-semibold text-warm-900 dark:text-warm-50 hover:text-primary-500">
                      {p.display_name}
                    </h3>
                    <p className="text-xs text-warm-600 dark:text-warm-400">@{p.username}</p>
                  </div>
                  {user && user.id !== p.user_id && (
                    <button
                      onClick={() => handleFollowToggle(p.user_id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                        following.has(p.user_id) ? 'btn-secondary' : 'btn-primary'
                      }`}
                    >
                      {following.has(p.user_id) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
