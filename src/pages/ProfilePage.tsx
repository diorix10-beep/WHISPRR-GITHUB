import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Link2, Calendar, Edit2, Check, X } from 'lucide-react';
import type { Profile, Whisper, Reaction } from '../types';
import { MOODS, INTERESTS } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useInterests } from '../contexts/InterestContext';
import { Avatar } from '../components/common/Avatar';
import { MoodBadge } from '../components/common/MoodBadge';
import { UserBadges } from '../components/common/UserBadges';
import { FollowListModal } from '../components/profile/FollowListModal';
import { PhotoUpload } from '../components/common/PhotoUpload';

interface WhisperWithProfile extends Whisper {
  profiles: Profile;
  reactions: Reaction[];
  comment_count: number;
}

export default function ProfilePage() {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { track } = useInterests();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [whispers, setWhispers] = useState<WhisperWithProfile[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    mood: '',
    interests: [] as string[],
    location: '',
    website: '',
    birthday: '',
    avatar_emoji: '',
  });

  // Modal state
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following';
  }>({ isOpen: false, type: 'followers' });

  // Photo upload state
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // Determine which profile to fetch
        let profileQuery = supabase.from('profiles').select('*');

        if (paramUsername) {
          profileQuery = profileQuery.eq('username', paramUsername);
        } else if (user) {
          profileQuery = profileQuery.eq('user_id', user.id);
        } else {
          setLoading(false);
          return;
        }

        const { data: profileData } = await profileQuery.maybeSingle();

        if (!profileData) {
          setLoading(false);
          return;
        }

        setProfile(profileData);
        const isOwn = !paramUsername || (!!user && profileData.user_id === user.id);
        setIsOwnProfile(isOwn);

        // Track profile visit for interest learning (only other profiles)
        if (!isOwn && profileData.user_id) {
          track({
            eventType: 'profile_visit',
            targetType: 'profile',
            targetId: profileData.user_id,
            interests: profileData.interests || [],
            mood: profileData.mood || undefined,
          });
        }

        // Initialize edit form
        setEditForm({
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          mood: profileData.mood || '',
          interests: profileData.interests || [],
          location: profileData.location || '',
          website: profileData.website || '',
          birthday: profileData.birthday || '',
          avatar_emoji: profileData.avatar_emoji || '',
        });

        // Fetch follow counts
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('following_id', profileData.user_id);

        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('follower_id', profileData.user_id);

        setFollowerCount(followers || 0);
        setFollowingCount(following || 0);

        // Check if current user is following this profile
        if (user && !isOwn) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', profileData.user_id)
            .maybeSingle();

          setIsFollowing(!!followData);

          // Check if this profile follows the current user
          const { data: followsYouData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', profileData.user_id)
            .eq('following_id', user.id)
            .maybeSingle();

          setFollowsYou(!!followsYouData);
        }

        // Fetch user's whispers
        const { data: whispersData } = await supabase
          .from('whispers')
          .select(
            `
            *,
            profiles:user_id(
              id, user_id, display_name, username, avatar_emoji, photo_url, bio, mood, badges
            ),
            reactions(id, whisper_id, user_id, type, created_at)
          `
          )
          .eq('user_id', profileData.user_id)
          .is('parent_id', null)
          .order('created_at', { ascending: false });

        if (whispersData) {
          // Fetch comment counts from comments table
          const { data: commentData } = await supabase
            .from('comments')
            .select('whisper_id')
            .in('whisper_id', whispersData.map(w => w.id));

          const commentMap = new Map<string, number>();
          commentData?.forEach(comment => {
            commentMap.set(
              comment.whisper_id,
              (commentMap.get(comment.whisper_id) || 0) + 1
            );
          });

          const whispersWithCounts = whispersData.map((whisper: any) => ({
            ...whisper,
            comment_count: commentMap.get(whisper.id) || 0,
          }));

          setWhispers(whispersWithCounts);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [paramUsername, user]);

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id);
      } else {
        // Follow
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: profile.user_id,
        });
      }

      const newFollowingState = !isFollowing;
      setIsFollowing(newFollowingState);
      setFollowerCount(prevCount => newFollowingState ? prevCount + 1 : prevCount - 1);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleEditSave = async () => {
    if (!profile) return;

    try {
      await updateProfile({
        display_name: editForm.display_name,
        bio: editForm.bio,
        mood: editForm.mood,
        interests: editForm.interests,
        location: editForm.location,
        website: editForm.website,
        birthday: editForm.birthday,
        avatar_emoji: editForm.avatar_emoji,
      });

      setProfile({
        ...profile,
        ...editForm,
      });

      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handlePhotoUpdated = async (url: string | null) => {
    if (!profile) return;
    const updatedProfile = { ...profile, photo_url: url };
    setProfile(updatedProfile);
    setIsPhotoUploading(false);
    // Also update auth context profile if own profile
    if (isOwnProfile) {
      await updateProfile({ photo_url: url });
    }
  };

  const handlePhotoClick = () => {
    if (isOwnProfile) {
      setShowPhotoUpload(true);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-300 border-t-primary-500 mx-auto mb-4" />
          <p className="text-warm-600 dark:text-warm-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-lg text-warm-600 dark:text-warm-400 mb-4">
            Profile not found
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pb-24">
      {isEditMode ? (
        // Edit Mode
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="section-title">Edit Profile</h1>
            <button
              onClick={() => setIsEditMode(false)}
              className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Avatar Emoji Edit */}
          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                emoji={editForm.avatar_emoji}
                photoUrl={profile.photo_url}
                size="lg"
                editable
                onPhotoClick={() => setShowPhotoUpload(true)}
                uploading={isPhotoUploading}
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  maxLength={2}
                  value={editForm.avatar_emoji}
                  onChange={(e) =>
                    setEditForm(prev => ({ ...prev, avatar_emoji: e.target.value }))
                  }
                  className="input-field"
                  placeholder="Fallback emoji"
                />
                <p className="text-xs text-warm-500 dark:text-warm-400">
                  Click the avatar to upload a photo, or set an emoji as fallback
                </p>
              </div>
            </div>
          </div>

          {/* Display Name Edit */}
          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={editForm.display_name}
              onChange={(e) =>
                setEditForm(prev => ({ ...prev, display_name: e.target.value }))
              }
              className="input-field"
            />
          </div>

          {/* Bio Edit */}
          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
              Bio
            </label>
            <textarea
              value={editForm.bio}
              onChange={(e) =>
                setEditForm(prev => ({ ...prev, bio: e.target.value }))
              }
              className="input-field h-24"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Mood Edit */}
          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
              Current Mood
            </label>
            <select
              value={editForm.mood}
              onChange={(e) =>
                setEditForm(prev => ({ ...prev, mood: e.target.value }))
              }
              className="input-field"
            >
              <option value="">Select a mood...</option>
              {MOODS.map(mood => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>

          {/* Interests Edit */}
          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-3">
              Interests
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    editForm.interests.includes(interest)
                      ? 'bg-primary-500 text-white'
                      : 'bg-warm-100 text-warm-700 dark:bg-warm-700 dark:text-warm-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Location Edit */}
          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
              Location
            </label>
            <input
              type="text"
              value={editForm.location}
              onChange={(e) =>
                setEditForm(prev => ({ ...prev, location: e.target.value }))
              }
              className="input-field"
              placeholder="City, Country"
            />
          </div>

          {/* Website Edit */}
          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
              Website
            </label>
            <input
              type="url"
              value={editForm.website}
              onChange={(e) =>
                setEditForm(prev => ({ ...prev, website: e.target.value }))
              }
              className="input-field"
              placeholder="https://example.com"
            />
          </div>

          {/* Birthday Edit */}
          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
              Birthday
            </label>
            <input
              type="date"
              value={editForm.birthday}
              onChange={(e) =>
                setEditForm(prev => ({ ...prev, birthday: e.target.value }))
              }
              className="input-field"
            />
          </div>

          {/* Save and Cancel Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleEditSave}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Save Changes
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          {/* Profile Header */}
          <div className="text-center mb-8">
            <Avatar
              emoji={profile.avatar_emoji}
              photoUrl={profile.photo_url}
              size="xl"
              editable={isOwnProfile}
              onPhotoClick={handlePhotoClick}
              uploading={isPhotoUploading}
            />
            <h1 className="section-title mt-4 flex items-center justify-center gap-1">
              {profile.display_name}
              <UserBadges badges={profile.badges} size="lg" />
            </h1>
            <p
              className="text-warm-600 dark:text-warm-400 cursor-pointer hover:text-primary-500"
              onClick={() => navigate(`/profile/${profile.username}`)}
            >
              @{profile.username}
            </p>
            {!isOwnProfile && followsYou && (
              <span className="inline-block mt-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-warm-200 dark:bg-warm-700 text-warm-600 dark:text-warm-300">
                Follows you
              </span>
            )}
            {profile.mood && (
              <div className="mt-3 flex justify-center">
                <MoodBadge mood={profile.mood} />
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-center text-warm-700 dark:text-warm-300 mb-6">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8 py-4 border-y border-warm-200 dark:border-warm-700">
            <button
              onClick={() => setFollowModal({ isOpen: true, type: 'followers' })}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <div className="text-xl font-bold text-warm-900 dark:text-warm-50">
                {followerCount}
              </div>
              <div className="text-sm text-warm-600 dark:text-warm-400">
                Followers
              </div>
            </button>
            <button
              onClick={() => setFollowModal({ isOpen: true, type: 'following' })}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <div className="text-xl font-bold text-warm-900 dark:text-warm-50">
                {followingCount}
              </div>
              <div className="text-sm text-warm-600 dark:text-warm-400">
                Following
              </div>
            </button>
          </div>

          {/* Interests */}
          {profile.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-50 mb-3">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(interest => (
                  <span
                    key={interest}
                    className="px-3 py-1.5 rounded-full text-sm font-medium
                      bg-primary-100 text-primary-700
                      dark:bg-primary-900 dark:text-primary-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-2 mb-6 text-warm-700 dark:text-warm-300">
            {profile.location && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-2">
                <Link2 size={16} />
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:underline truncate"
                >
                  {profile.website}
                </a>
              </div>
            )}
            {profile.birthday && (
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{new Date(profile.birthday).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`flex-1 ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Whispers Section */}
          <div>
            <h2 className="section-title mb-4">Whispers</h2>
            {whispers.length === 0 ? (
              <div className="text-center py-8 text-warm-600 dark:text-warm-400">
                No whispers yet
              </div>
            ) : (
              <div className="space-y-4">
                {whispers.map(whisper => (
                  <div
                    key={whisper.id}
                    className="card cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/whisper/${whisper.id}`)}
                  >
                    <p className="text-warm-900 dark:text-warm-50 mb-2">
                      {whisper.content}
                    </p>
                    {whisper.mood && (
                      <div className="mb-2">
                        <MoodBadge mood={whisper.mood} size="sm" />
                      </div>
                    )}
                    <div className="flex gap-4 text-xs text-warm-600 dark:text-warm-400">
                      <span>
                        {whisper.reactions?.length || 0} reactions
                      </span>
                      <span>{whisper.comment_count} comments</span>
                      <span>
                        {new Date(whisper.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Follow List Modal */}
      <FollowListModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal(prev => ({ ...prev, isOpen: false }))}
        userId={profile.user_id}
        type={followModal.type}
      />

      {/* Photo Upload Modal */}
      <PhotoUpload
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        currentPhotoUrl={profile.photo_url}
        onPhotoUpdated={handlePhotoUpdated}
      />
    </div>
  );
}
