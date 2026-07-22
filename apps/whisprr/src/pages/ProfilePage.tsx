import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MapPin, Calendar, Edit2, Check, X, Camera, MessageCircle, 
  Heart, Award, Pin, Globe, Twitter, Instagram, Github, 
  Linkedin, MessageSquare, Youtube, Music, Tv, Gamepad, Chrome, 
  Sparkles, Plus, Search, ArrowUp, ArrowDown, Trash2, HeartHandshake,
  Compass, HelpCircle, MoreVertical, ShieldAlert, UserMinus, VolumeX
} from 'lucide-react';
import { ModerationModal } from '../components/modals/ModerationModal';
import type { Profile, Whisper, Reaction } from '../types';
import { INTERESTS, PERSONALITY_BADGES, PERSONAL_VALUES, LOOKING_FOR_OPTIONS } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useInterests } from '../contexts/InterestContext';
import { Avatar } from '../components/common/Avatar';
// import { MoodBadge } from '../components/common/MoodBadge';
import { UserBadges } from '../components/common/UserBadges';
import { FollowListModal } from '../components/profile/FollowListModal';
import { PhotoUpload } from '../components/common/PhotoUpload';
import { BannerUpload } from '../components/profile/BannerUpload';
import { WhisperCard } from '../components/feed/WhisperCard';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

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
  const [showModerationDropdown, setShowModerationDropdown] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationType, setModerationType] = useState<'user' | 'whisper' | 'comment'>('user');
  const [loading, setLoading] = useState(true);
  const [whispers, setWhispers] = useState<WhisperWithProfile[]>([]);
  const [pinnedWhisper, setPinnedWhisper] = useState<WhisperWithProfile | null>(null);
  
  // Stats
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [communitiesCount, setCommunitiesCount] = useState(0);
  const [repliesCount, setRepliesCount] = useState(0);
  const [helpfulContributions, setHelpfulContributions] = useState(0);
  
  const [searchParams] = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);

  type ProfileTab = 'stories' | 'characters' | 'worlds' | 'lorebooks';
  const [activeTab, setActiveTab] = useState<ProfileTab>('stories');
  const [tabLoading, setTabLoading] = useState(false);
  const [tabItems, setTabItems] = useState<any[]>([]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    interests: [] as string[],
    location: '',
    website: '',
    birthday: '',
    avatar_emoji: '',
    pronouns: '',
    languages: '', 
    personality_badges: [] as string[],
    personal_values: [] as string[],
    looking_for: [] as string[],
    currently_building: '',
    creator_role_1: '',
    creator_role_2: '',
    // Favorites
    fav_artist: '',
    fav_song: '',
    fav_movie: '',
    fav_book: '',
    fav_game: '',
    fav_quote: '',
    fav_hobby: '',
    // Social Links
    social_twitter: '',
    social_instagram: '',
    social_github: '',
    social_linkedin: '',
    social_spotify: '',
    social_youtube: '',
    social_twitch: '',
    social_discord: '',
    social_portfolio: '',
  });

  // Interests management state in Edit mode
  const [interestSearch, setInterestSearch] = useState('');
  const [customInterest, setCustomInterest] = useState('');

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const checkUsernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal state
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following';
  }>({ isOpen: false, type: 'followers' });

  // Photo/Banner upload state
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showBannerUpload, setShowBannerUpload] = useState(false);
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
          });
        }

        // Initialize edit form
        const socialLinks = profileData.social_links || {};
        const favorites = profileData.favorites || {};
        
        setEditForm({
          username: profileData.username || '',
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          interests: profileData.interests || [],
          location: profileData.location || '',
          website: profileData.website || '',
          birthday: profileData.birthday || '',
          pronouns: profileData.pronouns || '',
          languages: (profileData.languages || []).join(', '),
          personality_badges: profileData.personality_badges || [],
          personal_values: profileData.personal_values || [],
          looking_for: profileData.looking_for || [],
          currently_building: profileData.currently_building || '',
          creator_role_1: profileData.creator_role_1 || '',
          creator_role_2: profileData.creator_role_2 || '',
          // Favorites
          fav_artist: favorites.artist || '',
          fav_song: favorites.song || '',
          fav_movie: favorites.movie || '',
          fav_book: favorites.book || '',
          fav_game: favorites.game || '',
          fav_quote: favorites.quote || '',
          fav_hobby: favorites.hobby || '',
          // Social Links
          social_twitter: socialLinks.twitter || '',
          social_instagram: socialLinks.instagram || '',
          social_github: socialLinks.github || '',
          social_linkedin: socialLinks.linkedin || '',
          social_spotify: socialLinks.spotify || '',
          social_youtube: socialLinks.youtube || '',
          social_twitch: socialLinks.twitch || '',
          social_discord: socialLinks.discord || '',
          social_portfolio: socialLinks.portfolio || '',
        });

        // Fetch follow counts
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profileData.user_id);

        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profileData.user_id);

        setFollowerCount(followers || 0);
        setFollowingCount(following || 0);
        
        // Fetch meaningful stats (communities, replies)
        const { count: communitiesJoined } = await supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profileData.user_id);
          
        const { count: totalReplies } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profileData.user_id);
          
        setCommunitiesCount(communitiesJoined || 0);
        setRepliesCount(totalReplies || 0);

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
          .select(`
            *,
            profiles:user_id(
              id, user_id, display_name, username, photo_url, bio, badges
            ),
            reactions(id, whisper_id, user_id, type, created_at)
          `)
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
          
          // Calculate helpful contributions: sum of all reactions on whispers
          let totalReactions = 0;
          whispersWithCounts.forEach(w => {
            totalReactions += w.reactions?.length || 0;
          });
          setHelpfulContributions(totalReactions);
          
          if (profileData.pinned_whisper_id) {
             const pinned = whispersWithCounts.find((w: any) => w.id === profileData.pinned_whisper_id);
             if (pinned) setPinnedWhisper(pinned);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [paramUsername, user, track]);

  useEffect(() => {
    if (searchParams.get('edit') === 'true' && isOwnProfile && profile) {
      setIsEditMode(true);
    }
  }, [searchParams, isOwnProfile, profile]);

  // Fetch tab content when activeTab changes
  useEffect(() => {
    if (!profile) return;
    const fetchTabContent = async () => {
      setTabLoading(true);
      try {
        let items: any[] = [];
        if (activeTab === 'stories') {
          const { data } = await supabase
            .from('stories')
            .select('*')
            .eq('user_id', profile.user_id)
            .order('created_at', { ascending: false });
          items = data || [];
        } else if (activeTab === 'characters') {
          const { data } = await supabase
            .from('ai_characters')
            .select('*')
            .eq('creator_id', profile.user_id)
            .order('created_at', { ascending: false });
          items = data || [];
        } else if (activeTab === 'worlds') {
          const { data } = await supabase
            .from('worlds')
            .select('*')
            .eq('user_id', profile.user_id)
            .order('created_at', { ascending: false });
          items = data || [];
        } else if (activeTab === 'lorebooks') {
          const { data } = await supabase
            .from('lorebooks')
            .select('*')
            .eq('user_id', profile.user_id)
            .order('created_at', { ascending: false });
          items = data || [];
        }
        setTabItems(items);
      } catch (err) {
        console.error('Error fetching tab content:', err);
      } finally {
        setTabLoading(false);
      }
    };
    
    fetchTabContent();
  }, [activeTab, profile, isOwnProfile]);

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
    if (!profile || usernameError) return;

    setSaving(true);
    setEditError(null);
    try {
      const social_links = {
        ...(editForm.social_twitter ? { twitter: editForm.social_twitter } : {}),
        ...(editForm.social_instagram ? { instagram: editForm.social_instagram } : {}),
        ...(editForm.social_github ? { github: editForm.social_github } : {}),
        ...(editForm.social_linkedin ? { linkedin: editForm.social_linkedin } : {}),
        ...(editForm.social_spotify ? { spotify: editForm.social_spotify } : {}),
        ...(editForm.social_youtube ? { youtube: editForm.social_youtube } : {}),
        ...(editForm.social_twitch ? { twitch: editForm.social_twitch } : {}),
        ...(editForm.social_discord ? { discord: editForm.social_discord } : {}),
        ...(editForm.social_portfolio ? { portfolio: editForm.social_portfolio } : {}),
      };

      const favorites = {
        ...(editForm.fav_book ? { book: editForm.fav_book } : {}),
        ...(editForm.fav_quote ? { quote: editForm.fav_quote } : {}),
        ...(editForm.fav_hobby ? { hobby: editForm.fav_hobby } : {}),
      };
      
      const languages = editForm.languages.split(',').map(l => l.trim()).filter(l => l);

      const updates = {
        username: editForm.username,
        display_name: editForm.display_name,
        bio: editForm.bio,
        interests: editForm.interests,
        location: editForm.location,
        website: editForm.website,
        birthday: editForm.birthday,
        pronouns: editForm.pronouns,
        languages,
        social_links,
        personality_badges: editForm.personality_badges,
        personal_values: editForm.personal_values,
        looking_for: editForm.looking_for,
        favorites,
        currently_building: editForm.currently_building,
        creator_role_1: editForm.creator_role_1,
        creator_role_2: editForm.creator_role_2,
      };

      await updateProfile(updates);

      setProfile({
        ...profile,
        ...updates,
      } as any);

      setIsEditMode(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setEditError(error.message || 'Could not save profile changes. Please try again.');
    }
  };

  // Interests reordering & management
  const handleInterestRemove = (interest: string) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleInterestAdd = (interest: string) => {
    if (!interest || editForm.interests.includes(interest)) return;
    setEditForm(prev => ({
      ...prev,
      interests: [...prev.interests, interest]
    }));
    setCustomInterest('');
  };

  const handleInterestMove = (index: number, direction: 'up' | 'down') => {
    const newInterests = [...editForm.interests];
    if (direction === 'up' && index > 0) {
      const temp = newInterests[index];
      newInterests[index] = newInterests[index - 1];
      newInterests[index - 1] = temp;
    } else if (direction === 'down' && index < newInterests.length - 1) {
      const temp = newInterests[index];
      newInterests[index] = newInterests[index + 1];
      newInterests[index + 1] = temp;
    }
    setEditForm(prev => ({ ...prev, interests: newInterests }));
  };

  const handleBadgeToggle = (badge: string) => {
    setEditForm(prev => ({
      ...prev,
      personality_badges: prev.personality_badges.includes(badge)
        ? prev.personality_badges.filter(i => i !== badge)
        : [...prev.personality_badges, badge],
    }));
  };

  const handleValueToggle = (value: string) => {
    setEditForm(prev => ({
      ...prev,
      personal_values: prev.personal_values.includes(value)
        ? prev.personal_values.filter(v => v !== value)
        : [...prev.personal_values, value],
    }));
  };

  const handleLookingForToggle = (option: string) => {
    setEditForm(prev => ({
      ...prev,
      looking_for: prev.looking_for.includes(option)
        ? prev.looking_for.filter(o => o !== option)
        : [...prev.looking_for, option],
    }));
  };

  const handlePhotoUpdated = async (url: string | null) => {
    if (!profile) return;
    const updatedProfile = { ...profile, photo_url: url };
    setProfile(updatedProfile);
    setIsPhotoUploading(false);
    if (isOwnProfile) {
      await updateProfile({ photo_url: url });
    }
  };

  const handleBannerUpdated = async (url: string | null) => {
    if (!profile) return;
    const updatedProfile = { ...profile, banner_url: url };
    setProfile(updatedProfile);
    if (isOwnProfile) {
      await updateProfile({ banner_url: url });
    }
  };

  const handleStartConversation = async () => {
    if (!user || !profile) return;

    try {
      // 1. Fetch current user's conversations
      const { data: myConvs, error: myConvsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myConvsError) throw myConvsError;

      const myIds = (myConvs || []).map(c => c.conversation_id);
      if (myIds.length > 0) {
        // 2. See if the target user shares any DM with current user
        const { data: match, error: matchError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversations(type)')
          .in('conversation_id', myIds)
          .eq('user_id', profile.user_id);

        if (matchError) throw matchError;

        const existing = match?.find((m: any) => m.conversations?.type === 'dm');
        if (existing) {
          navigate(`/messages/${existing.conversation_id}`);
          return;
        }
      }

      // 3. Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'dm',
          created_by: user.id,
        })
        .select()
        .maybeSingle();

      if (createError) throw createError;

      if (!newConv) {
        throw new Error('Failed to create conversation.');
      }

      // 4. Add participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: profile.user_id },
        ]);

      if (partError) throw partError;

      navigate(`/messages/${newConv.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handlePinWhisper = async (whisperId: string) => {
    if (!profile || !isOwnProfile) return;
    
    // Toggle pin
    const newPinnedId = profile.pinned_whisper_id === whisperId ? null : whisperId;
    
    try {
      await updateProfile({ pinned_whisper_id: newPinnedId });
      setProfile({ ...profile, pinned_whisper_id: newPinnedId });
      
      if (newPinnedId) {
        const pinned = whispers.find(w => w.id === newPinnedId);
        if (pinned) setPinnedWhisper(pinned);
      } else {
        setPinnedWhisper(null);
      }
    } catch (error) {
      console.error('Error pinning whisper:', error);
    }
  };

  const formatLastUpdated = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return new Date(dateStr).toLocaleDateString();
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
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  const socialLinks = profile.social_links || {};
  const favorites = profile.favorites || {};
  const hasSocialLinks = profile.website || Object.keys(socialLinks).length > 0;
  
  // Filter interests by search term in Edit Mode
  const filteredPredefinedInterests = INTERESTS.filter(interest => 
    interest.toLowerCase().includes(interestSearch.toLowerCase()) && 
    !editForm.interests.includes(interest)
  );

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 pb-24">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-warm-200 dark:bg-warm-800 w-full overflow-hidden">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Profile Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40" />
        )}
        
        {isOwnProfile && (
           <button 
             onClick={() => setShowBannerUpload(true)}
             className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
           >
             <Camera size={18} />
           </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {isEditMode ? (
          // Edit Mode
          <div className="bg-white dark:bg-warm-800 rounded-3xl shadow-sm p-6 sm:p-8 -mt-12 relative z-10 border border-warm-100 dark:border-warm-800 mb-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-serif text-2xl font-bold text-warm-900 dark:text-warm-50">Edit Profile</h1>
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setEditError(null);
                }}
                className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error message */}
            {editError && (
              <div className="bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 p-4 rounded-2xl text-sm">
                <p className="font-semibold">Failed to save profile changes.</p>
                <p className="mt-1 text-xs opacity-90">{editError}</p>
                {editError.includes('column') && (
                  <p className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    Pro-tip: Make sure you have run the database migration SQL in your Supabase Dashboard SQL Editor!
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username Edit */}
              <div>
                <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400">@</span>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => {
                      const newUsername = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      setEditForm(prev => ({ ...prev, username: newUsername }));
                      
                      // Live validation
                      if (checkUsernameTimeoutRef.current) clearTimeout(checkUsernameTimeoutRef.current);
                      if (newUsername === profile?.username) {
                        setUsernameError(null);
                        return;
                      }
                      if (newUsername.length < 3) {
                        setUsernameError('Username must be at least 3 characters');
                        return;
                      }
                      
                      setIsCheckingUsername(true);
                      checkUsernameTimeoutRef.current = setTimeout(async () => {
                        const { data } = await supabase.from('profiles').select('id').eq('username', newUsername).maybeSingle();
                        if (data) {
                          setUsernameError('Username is already taken');
                        } else {
                          setUsernameError(null);
                        }
                        setIsCheckingUsername(false);
                      }, 500);
                    }}
                    className={`input-field pl-8 ${usernameError ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                    maxLength={30}
                  />
                  {isCheckingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                {usernameError && <p className="mt-1 text-xs text-error-500">{usernameError}</p>}
                {!usernameError && editForm.username !== profile?.username && editForm.username.length >= 3 && !isCheckingUsername && (
                   <p className="mt-1 text-xs text-green-500 flex items-center gap-1"><Check size={12}/> Username is available</p>
                )}
              </div>

              {/* Display Name Edit */}
              <div>
                <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">Display Name</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                  className="input-field"
                />
              </div>

              {/* Pronouns Edit */}
              <div>
                <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">Pronouns</label>
                <input
                  type="text"
                  value={editForm.pronouns}
                  onChange={(e) => setEditForm(prev => ({ ...prev, pronouns: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. she/her, they/them"
                />
              </div>
            </div>

            {/* Bio Edit */}
            <div>
              <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
                Bio (Express yourself)
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                className="input-field min-h-[120px]"
                maxLength={1000}
                placeholder="Tell the community about yourself..."
              />
              <div className="text-right text-xs text-warm-500 mt-1">{editForm.bio.length}/1000</div>
            </div>

            {/* Creator Identity & Projects */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-4 border-b border-warm-100 dark:border-warm-800">
              <div>
                <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">Creator Label 1</label>
                <input
                  type="text"
                  value={editForm.creator_role_1}
                  onChange={(e) => setEditForm(prev => ({ ...prev, creator_role_1: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. AI Roleplay Creator"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">Creator Label 2</label>
                <input
                  type="text"
                  value={editForm.creator_role_2}
                  onChange={(e) => setEditForm(prev => ({ ...prev, creator_role_2: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Worldbuilder"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">Currently Building</label>
                <input
                  type="text"
                  value={editForm.currently_building}
                  onChange={(e) => setEditForm(prev => ({ ...prev, currently_building: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. The Kingdom of Asteria"
                />
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Edit */}
              <div>
                <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="input-field"
                  placeholder="City, Country"
                />
              </div>
              
              {/* Languages Edit */}
              <div>
                <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">Languages Spoken</label>
                <input
                  type="text"
                  value={editForm.languages}
                  onChange={(e) => setEditForm(prev => ({ ...prev, languages: e.target.value }))}
                  className="input-field"
                  placeholder="English, Spanish, French..."
                />
              </div>
            </div>

            {/* Looking For Option Edit */}
            <div>
              <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-1">
                Looking For on WHISPRR
              </label>
              <p className="text-xs text-warm-500 mb-3">Help others connect with you with shared intentions.</p>
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR_OPTIONS.map(option => (
                  <button
                    key={option}
                    onClick={() => handleLookingForToggle(option)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      editForm.looking_for.includes(option)
                        ? 'bg-primary-500 text-white'
                        : 'bg-warm-100 text-warm-700 dark:bg-warm-700 dark:text-warm-200 hover:bg-warm-200 dark:hover:bg-warm-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Values Edit */}
            <div>
              <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-1">
                Personal Values
              </label>
              <p className="text-xs text-warm-500 mb-3">Share values that matter most to you.</p>
              <div className="flex flex-wrap gap-2">
                {PERSONAL_VALUES.map(value => (
                  <button
                    key={value}
                    onClick={() => handleValueToggle(value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      editForm.personal_values.includes(value)
                        ? 'bg-primary-500 text-white'
                        : 'bg-warm-100 text-warm-700 dark:bg-warm-700 dark:text-warm-200 hover:bg-warm-200 dark:hover:bg-warm-600'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Favorites Edit */}
            <div>
              <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-3">Creative Favorites</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1">Favorite Book or Story</label>
                    <input type="text" value={editForm.fav_book} onChange={e => setEditForm(prev => ({ ...prev, fav_book: e.target.value }))} className="input-field" placeholder="Book or Story title" />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1">Creative Inspiration</label>
                    <input type="text" value={editForm.fav_hobby} onChange={e => setEditForm(prev => ({ ...prev, fav_hobby: e.target.value }))} className="input-field" placeholder="e.g. Cyberpunk, Mythologies, Ghibli" />
                 </div>
              </div>
              <div className="mt-3">
                 <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1">Favorite Quote</label>
                 <input type="text" value={editForm.fav_quote} onChange={e => setEditForm(prev => ({ ...prev, fav_quote: e.target.value }))} className="input-field" placeholder="A quote that inspires your creativity" />
              </div>
            </div>
            
            {/* Social Links */}
            <div>
              <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-3">Links & Portfolios</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex items-center gap-2">
                   <Globe size={18} className="text-warm-400 shrink-0" />
                   <input type="url" value={editForm.website} onChange={e => setEditForm(prev => ({ ...prev, website: e.target.value }))} className="input-field py-2" placeholder="Website URL" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Chrome size={18} className="text-warm-400 shrink-0" />
                   <input type="url" value={editForm.social_portfolio} onChange={e => setEditForm(prev => ({ ...prev, social_portfolio: e.target.value }))} className="input-field py-2" placeholder="Portfolio URL" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Twitter size={18} className="text-[#1DA1F2] shrink-0" />
                   <input type="text" value={editForm.social_twitter} onChange={e => setEditForm(prev => ({ ...prev, social_twitter: e.target.value }))} className="input-field py-2" placeholder="Twitter username" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Instagram size={18} className="text-[#E1306C] shrink-0" />
                   <input type="text" value={editForm.social_instagram} onChange={e => setEditForm(prev => ({ ...prev, social_instagram: e.target.value }))} className="input-field py-2" placeholder="Instagram username" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Github size={18} className="text-warm-800 dark:text-warm-100 shrink-0" />
                   <input type="text" value={editForm.social_github} onChange={e => setEditForm(prev => ({ ...prev, social_github: e.target.value }))} className="input-field py-2" placeholder="GitHub username" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Linkedin size={18} className="text-[#0A66C2] shrink-0" />
                   <input type="text" value={editForm.social_linkedin} onChange={e => setEditForm(prev => ({ ...prev, social_linkedin: e.target.value }))} className="input-field py-2" placeholder="LinkedIn username" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Music size={18} className="text-[#1DB954] shrink-0" />
                   <input type="text" value={editForm.social_spotify} onChange={e => setEditForm(prev => ({ ...prev, social_spotify: e.target.value }))} className="input-field py-2" placeholder="Spotify username/URL" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Youtube size={18} className="text-[#FF0000] shrink-0" />
                   <input type="text" value={editForm.social_youtube} onChange={e => setEditForm(prev => ({ ...prev, social_youtube: e.target.value }))} className="input-field py-2" placeholder="YouTube channel" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Tv size={18} className="text-[#9146FF] shrink-0" />
                   <input type="text" value={editForm.social_twitch} onChange={e => setEditForm(prev => ({ ...prev, social_twitch: e.target.value }))} className="input-field py-2" placeholder="Twitch username" />
                 </div>
                 <div className="flex items-center gap-2">
                   <MessageSquare size={18} className="text-[#5865F2] shrink-0" />
                   <input type="text" value={editForm.social_discord} onChange={e => setEditForm(prev => ({ ...prev, social_discord: e.target.value }))} className="input-field py-2" placeholder="Discord server/handle" />
                 </div>
              </div>
            </div>

            {/* Personality Badges Edit */}
            <div>
              <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-1">
                Personality Badges
              </label>
              <p className="text-xs text-warm-500 mb-3">Select badges that best describe your personality.</p>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_BADGES.map(badge => (
                  <button
                    key={badge}
                    onClick={() => handleBadgeToggle(badge)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      editForm.personality_badges.includes(badge)
                        ? 'bg-primary-500 text-white'
                        : 'bg-warm-100 text-warm-700 dark:bg-warm-700 dark:text-warm-200 hover:bg-warm-200 dark:hover:bg-warm-600'
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>

            {/* Creative Focus & Specialties (Search, Add, Reorder) */}
            <div>
              <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-1">
                Creative Focus & Specialties (Organize and Reorder)
              </label>
              <p className="text-xs text-warm-500 mb-3">Add specialties, search genres, and reorder to showcase what you build first.</p>
              
              {/* Selected Interests list with Reorder & Remove controls */}
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto p-2 bg-warm-50 dark:bg-warm-900 rounded-xl">
                 {editForm.interests.length === 0 ? (
                   <span className="text-sm text-warm-500 block text-center py-4">No interests selected. Choose or add below.</span>
                 ) : (
                   editForm.interests.map((interest, idx) => (
                     <div key={interest} className="flex items-center justify-between bg-white dark:bg-warm-850 p-2 rounded-lg border border-warm-100 dark:border-warm-800 shadow-sm text-sm">
                       <span className="font-medium text-warm-800 dark:text-warm-200">{interest}</span>
                       <div className="flex items-center gap-1">
                         <button 
                           onClick={() => handleInterestMove(idx, 'up')}
                           disabled={idx === 0}
                           className="p-1 text-warm-500 hover:text-primary-500 disabled:opacity-30"
                         >
                           <ArrowUp size={16} />
                         </button>
                         <button 
                           onClick={() => handleInterestMove(idx, 'down')}
                           disabled={idx === editForm.interests.length - 1}
                           className="p-1 text-warm-500 hover:text-primary-500 disabled:opacity-30"
                         >
                           <ArrowDown size={16} />
                         </button>
                         <button 
                           onClick={() => handleInterestRemove(interest)}
                           className="p-1 text-error-500 hover:bg-error-50 dark:hover:bg-error-950/20 rounded"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                   ))
                 )}
              </div>

              {/* Add Custom / Predefined Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1">Search & Select Specialties</label>
                   <div className="relative mb-2">
                     <Search size={16} className="absolute left-3 top-2.5 text-warm-400" />
                     <input 
                       type="text" 
                       value={interestSearch} 
                       onChange={e => setInterestSearch(e.target.value)} 
                       className="input-field pl-9 py-1.5 text-sm" 
                       placeholder="Search interests..." 
                     />
                   </div>
                   <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 border border-warm-100 dark:border-warm-800 rounded-lg">
                      {filteredPredefinedInterests.length === 0 ? (
                        <span className="text-xs text-warm-500 p-2">No matching categories found</span>
                      ) : (
                        filteredPredefinedInterests.map(interest => (
                          <button
                            key={interest}
                            onClick={() => handleInterestAdd(interest)}
                            className="text-xs bg-warm-100 dark:bg-warm-750 text-warm-800 dark:text-warm-200 px-2.5 py-1 rounded hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            + {interest}
                          </button>
                        ))
                      )}
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1">Add Custom Tag</label>
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={customInterest} 
                       onChange={e => setCustomInterest(e.target.value)} 
                       className="input-field py-1.5 text-sm" 
                       placeholder="e.g. Grimdark, High Fantasy, Sci-Fi" 
                     />
                     <button 
                       onClick={() => handleInterestAdd(customInterest.trim())}
                       className="btn-primary py-1.5 px-4 text-sm flex items-center gap-1"
                     >
                       <Plus size={16} /> Add
                     </button>
                   </div>
                 </div>
              </div>
            </div>

            {/* Save and Cancel Buttons */}
            <div className="flex gap-3 pt-4 border-t border-warm-100 dark:border-warm-800">
              <button onClick={() => setIsEditMode(false)} className="flex-1 btn-ghost">Cancel</button>
              <button onClick={handleEditSave} className="flex-1 btn-primary flex items-center justify-center gap-2">
                <Check size={18} /> Save Changes
              </button>
            </div>
          </div>
        ) : (
          // View Mode (Profile Experience 2.0)
          <div className="bg-white dark:bg-warm-800 rounded-3xl shadow-sm p-6 sm:p-8 -mt-16 relative z-10 border border-warm-100 dark:border-warm-800 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div className="flex items-end gap-5">
                <div className="relative">
                  <div className="ring-4 ring-white dark:ring-warm-800 rounded-full bg-white dark:bg-warm-800">
                    <Avatar
                      photoUrl={profile.photo_url}
                      size="xl"
                      editable={isOwnProfile}
                      onPhotoClick={() => setShowPhotoUpload(true)}
                      uploading={isPhotoUploading}
                    />
                  </div>
                </div>
                
                <div className="pb-2">
                  <h1 className="font-serif text-3xl font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                    {profile.display_name}
                    <UserBadges badges={profile.badges} role={profile.role} size="lg" />
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-warm-600 dark:text-warm-400 mt-1">
                    <span className="font-medium text-lg">@{profile.username}</span>
                    {profile.pronouns && (
                      <span className="text-sm bg-warm-100 dark:bg-warm-700 px-2 py-0.5 rounded text-warm-700 dark:text-warm-300 font-medium">
                        {profile.pronouns}
                      </span>
                    )}
                    {profile.role === 'founder' && (
                      <span className="text-xs bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-bold px-3 py-0.5 rounded-full">
                        👑 Building WHISPRR since Day One
                      </span>
                    )}
                    {!isOwnProfile && followsYou && (
                      <span className="text-xs font-medium bg-warm-200 dark:bg-warm-700 text-warm-600 dark:text-warm-300 px-2 py-0.5 rounded">
                        Follows you
                      </span>
                    )}
                  </div>
                  {(profile.creator_role_1 || profile.creator_role_2) && (
                    <div className="flex flex-wrap gap-1.5 items-center mt-2 text-xs font-semibold tracking-wide text-primary-600 dark:text-primary-400">
                      {profile.creator_role_1 && (
                        <span className="bg-primary-50 dark:bg-primary-950/40 px-2.5 py-0.5 rounded-full border border-primary-100/50 dark:border-primary-900/30">
                          ✨ {profile.creator_role_1}
                        </span>
                      )}
                      {profile.creator_role_2 && (
                        <span className="bg-primary-50 dark:bg-primary-950/40 px-2.5 py-0.5 rounded-full border border-primary-100/50 dark:border-primary-900/30">
                          🗺️ {profile.creator_role_2}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-4 text-sm text-warm-500 dark:text-warm-400 mt-2">
                    <button onClick={() => setFollowModal({ isOpen: true, type: 'followers' })} className="hover:underline text-left">
                      <span className="font-bold text-warm-800 dark:text-warm-250">{followerCount}</span> followers
                    </button>
                    <button onClick={() => setFollowModal({ isOpen: true, type: 'following' })} className="hover:underline text-left">
                      <span className="font-bold text-warm-800 dark:text-warm-250">{followingCount}</span> following
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pb-2">
                {isOwnProfile ? (
                  <button onClick={() => setIsEditMode(true)} className="btn-secondary flex items-center gap-2 py-2 text-sm">
                    <Edit2 size={16} /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleFollow} className={`py-2 px-6 text-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button onClick={handleStartConversation} className="py-2 px-6 text-sm btn-primary flex items-center gap-1.5">
                      <MessageCircle size={16} />
                      Message
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowModerationDropdown(!showModerationDropdown); }}
                        className="py-2 px-3 text-sm btn-secondary flex items-center justify-center rounded-xl"
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {showModerationDropdown && (
                        <div 
                          className="absolute right-0 top-10 w-48 bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl shadow-lg py-2 z-30 animate-scale-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => { setShowModerationDropdown(false); setModerationType('user'); setShowModerationModal(true); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-warm-750 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750 transition-colors flex items-center gap-2"
                          >
                            <ShieldAlert size={14} /> Report Profile
                          </button>
                          <button
                            onClick={() => { setShowModerationDropdown(false); setModerationType('user'); setShowModerationModal(true); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-warm-750 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750 transition-colors flex items-center gap-2"
                          >
                            <VolumeX size={14} /> Mute User
                          </button>
                          <button
                            onClick={() => { setShowModerationDropdown(false); setModerationType('user'); setShowModerationModal(true); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors flex items-center gap-2"
                          >
                            <UserMinus size={14} /> Block User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

             {/* Currently Building section */}
            {profile.currently_building && (
              <div className="mb-6 p-5 bg-gradient-to-r from-primary-500/10 to-warm-500/10 dark:from-primary-950/20 dark:to-warm-900/15 rounded-3xl border border-primary-100/50 dark:border-primary-900/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">
                    🚀 Currently Building
                  </h3>
                  <p className="text-lg font-serif font-bold text-warm-900 dark:text-white leading-tight">
                    {profile.currently_building}
                  </p>
                </div>
              </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              {/* Left Column: Bio, Badges, Values, Looking For */}
              <div className="md:col-span-2 space-y-6">
                {profile.bio ? (
                  <div>
                    <p className="text-warm-800 dark:text-warm-200 text-lg leading-relaxed whitespace-pre-wrap font-serif">
                      {profile.bio}
                    </p>
                  </div>
                ) : (
                  <p className="text-warm-400 italic font-serif">No bio written yet.</p>
                )}
                
                {/* Personality Badges */}
                {profile.personality_badges && profile.personality_badges.length > 0 && (
                   <div className="flex flex-wrap gap-2 pt-2">
                     {profile.personality_badges.map(badge => (
                       <span key={badge} className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/50 transition-all hover:scale-105">
                         {badge}
                       </span>
                     ))}
                   </div>
                )}

                {/* Looking For */}
                {profile.looking_for && profile.looking_for.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Compass size={14} /> Looking For
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.looking_for.map(option => (
                        <span key={option} className="px-3 py-1 rounded-full text-sm font-medium bg-secondary-50 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300 border border-secondary-100 dark:border-secondary-900/50">
                          🎯 {option}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personal Values */}
                {profile.personal_values && profile.personal_values.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <HeartHandshake size={14} /> My Values
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.personal_values.map(val => (
                        <span key={val} className="px-3 py-1 rounded-full text-sm font-medium bg-warm-100 text-warm-800 dark:bg-warm-700 dark:text-warm-200">
                          ✨ {val}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorite Things Grid */}
                {Object.keys(favorites).length > 0 && (
                  <div className="pt-4 border-t border-warm-100 dark:border-warm-800">
                    <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Heart size={14} /> Creative Favorites
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {favorites.book && (
                        <div className="bg-warm-50/50 dark:bg-warm-900/20 p-3 rounded-xl border border-warm-100/30 dark:border-warm-800/30">
                          <span className="block text-xs text-warm-500">Favorite Book or Story</span>
                          <span className="font-semibold text-warm-800 dark:text-warm-200 text-sm mt-0.5 flex items-center gap-1.5"><HelpCircle size={14} className="text-primary-500 shrink-0" /> {favorites.book}</span>
                        </div>
                      )}
                      {favorites.hobby && (
                        <div className="bg-warm-50/50 dark:bg-warm-900/20 p-3 rounded-xl border border-warm-100/30 dark:border-warm-800/30">
                          <span className="block text-xs text-warm-500">Creative Inspiration</span>
                          <span className="font-semibold text-warm-800 dark:text-warm-200 text-sm mt-0.5 flex items-center gap-1.5"><Sparkles size={14} className="text-primary-500 shrink-0" /> {favorites.hobby}</span>
                        </div>
                      )}
                    </div>
                    {favorites.quote && (
                      <div className="mt-4 bg-warm-50/50 dark:bg-warm-900/20 p-4 rounded-xl border border-warm-100/30 dark:border-warm-800/30 font-serif italic text-center text-warm-700 dark:text-warm-300">
                        "{favorites.quote}"
                      </div>
                    )}
                  </div>
                )}

                {/* Creative Focus */}
                {profile.interests.length > 0 && (
                  <div className="pt-2 border-t border-warm-100 dark:border-warm-800">
                    <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3">My Creative Focus</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, idx) => (
                        <span key={`${interest}-${idx}`} className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-warm-100 text-warm-750 dark:bg-warm-700 dark:text-warm-200 shadow-sm border border-warm-200/20">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Meta & Links */}
              <div className="space-y-5 border-t md:border-t-0 md:border-l border-warm-100 dark:border-warm-800 pt-6 md:pt-0 md:pl-8">
                <div className="space-y-3.5 text-sm text-warm-700 dark:text-warm-300">
                  {profile.location && (
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-warm-400 shrink-0" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.languages && profile.languages.length > 0 && (
                    <div className="flex items-center gap-3">
                      <MessageCircle size={16} className="text-warm-400 shrink-0" />
                      <span>{profile.languages.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-warm-400 shrink-0" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric'})}</span>
                  </div>
                </div>

                {/* Social & Portfolio Links */}
                {hasSocialLinks && (
                  <div className="pt-4 border-t border-warm-100 dark:border-warm-800 space-y-3">
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                        <Globe size={16} className="shrink-0" /> Website
                      </a>
                    )}
                    {socialLinks.portfolio && (
                      <a href={socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                        <Chrome size={16} className="shrink-0" /> Portfolio
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a href={`https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-warm-700 dark:text-warm-300 hover:text-[#1DA1F2]">
                        <Twitter size={16} className="shrink-0" /> @{socialLinks.twitter}
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={`https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-warm-700 dark:text-warm-300 hover:text-[#E1306C]">
                        <Instagram size={16} className="shrink-0" /> @{socialLinks.instagram}
                      </a>
                    )}
                    {socialLinks.github && (
                      <a href={`https://github.com/${socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-warm-700 dark:text-warm-300 hover:text-black dark:hover:text-white">
                        <Github size={16} className="shrink-0" /> @{socialLinks.github}
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a href={`https://linkedin.com/in/${socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-warm-700 dark:text-warm-300 hover:text-[#0A66C2]">
                        <Linkedin size={16} className="shrink-0" /> LinkedIn
                      </a>
                    )}
                    {socialLinks.spotify && (
                      <a href={socialLinks.spotify.startsWith('http') ? socialLinks.spotify : `https://open.spotify.com/user/${socialLinks.spotify}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-warm-700 dark:text-warm-300 hover:text-[#1DB954]">
                        <Music size={16} className="shrink-0" /> Spotify
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-warm-700 dark:text-warm-300 hover:text-[#FF0000]">
                        <Youtube size={16} className="shrink-0" /> YouTube
                      </a>
                    )}
                    {socialLinks.twitch && (
                      <a href={`https://twitch.tv/${socialLinks.twitch}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-warm-700 dark:text-warm-300 hover:text-[#9146FF]">
                        <Tv size={16} className="shrink-0" /> Twitch
                      </a>
                    )}
                    {socialLinks.discord && (
                      <div className="flex items-center gap-3 text-sm text-warm-700 dark:text-warm-300">
                        <MessageSquare size={16} className="text-[#5865F2] shrink-0" />
                        <span>{socialLinks.discord}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Meaningful Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-warm-100 dark:border-warm-800">
               <div className="text-center p-3 rounded-2xl bg-warm-50 dark:bg-warm-900/50">
                 <div className="text-2xl font-bold text-warm-900 dark:text-warm-50">{whispers.length}</div>
                 <div className="text-xs font-medium text-warm-500 uppercase tracking-wide mt-1">Whispers</div>
               </div>
               <div className="text-center p-3 rounded-2xl bg-warm-50 dark:bg-warm-900/50">
                 <div className="text-2xl font-bold text-warm-900 dark:text-warm-50">{communitiesCount}</div>
                 <div className="text-xs font-medium text-warm-500 uppercase tracking-wide mt-1">Communities</div>
               </div>
               <div className="text-center p-3 rounded-2xl bg-warm-50 dark:bg-warm-900/50">
                 <div className="text-2xl font-bold text-warm-900 dark:text-warm-50">{repliesCount}</div>
                 <div className="text-xs font-medium text-warm-500 uppercase tracking-wide mt-1">Replies</div>
               </div>
               <div className="text-center p-3 rounded-2xl bg-warm-50 dark:bg-warm-900/50 cursor-pointer hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors" onClick={() => setFollowModal({ isOpen: true, type: 'followers' })}>
                 <div className="text-2.5 font-semibold text-primary-600 dark:text-primary-400 flex items-center justify-center gap-1">
                   <Award size={18} />
                   {helpfulContributions}
                 </div>
                 <div className="text-xs font-medium text-warm-500 uppercase tracking-wide mt-1">Helpful Hits</div>
               </div>
            </div>
          </div>
        )}

        {/* Pinned Whisper */}
        {!isEditMode && pinnedWhisper && (
          <div className="mb-8 relative">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-warm-900 dark:text-warm-50 mb-4">
              <Pin size={16} className="text-primary-500" /> Pinned Whisper
            </h2>
            <div className="relative group">
              {isOwnProfile && (
                <div className="absolute top-10 right-4 z-10">
                  <button onClick={(e) => { e.stopPropagation(); handlePinWhisper(pinnedWhisper.id); }} className="p-2 text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 bg-white/50 dark:bg-warm-800/50 rounded-full backdrop-blur">
                    <Pin size={16} className="fill-primary-500 text-primary-500" />
                  </button>
                </div>
              )}
              <WhisperCard whisper={pinnedWhisper as any} />
            </div>
          </div>
        )}

        {/* All Whispers Section */}
        {!isEditMode && (
          <div>
            <div className="flex items-center gap-4 border-b border-warm-100 dark:border-warm-800 mb-6 px-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('stories')}
                className={`py-3 px-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'stories' 
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                    : 'border-transparent text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                }`}
              >
                Stories
              </button>
              <button
                onClick={() => setActiveTab('characters')}
                className={`py-3 px-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'characters' 
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                    : 'border-transparent text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                }`}
              >
                Characters
              </button>
              <button
                onClick={() => setActiveTab('worlds')}
                className={`py-3 px-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'worlds' 
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                    : 'border-transparent text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                }`}
              >
                Worlds
              </button>
              <button
                onClick={() => setActiveTab('lorebooks')}
                className={`py-3 px-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'lorebooks' 
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                    : 'border-transparent text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                }`}
              >
                Lorebooks
              </button>
            </div>
            {tabLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-300 border-t-primary-500" />
              </div>
            ) : tabItems.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  icon={
                    activeTab === 'stories' ? Globe :
                    activeTab === 'characters' ? Sparkles :
                    activeTab === 'worlds' ? Compass :
                    HelpCircle
                  }
                  title={
                    activeTab === 'stories' ? 'No stories published' :
                    activeTab === 'characters' ? 'No characters published' :
                    activeTab === 'worlds' ? 'No worlds published' :
                    'No lorebooks published'
                  }
                  description={
                    isOwnProfile 
                      ? `Create and publish your ${activeTab.slice(0, -1)} inside CHIMERA to showcase it here!` 
                      : `This creator hasn't published any ${activeTab} yet.`
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTab === 'stories' && tabItems.map((story) => (
                  <div key={story.id} className="p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-100 dark:border-warm-800 shadow-sm flex flex-col justify-between">
                    <div>
                      {story.cover_url && (
                        <img src={story.cover_url} alt={story.title} className="w-full h-32 object-cover rounded-xl mb-4" />
                      )}
                      <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white mb-1.5">{story.title}</h3>
                      <p className="text-sm text-warm-600 dark:text-warm-300 line-clamp-3 leading-relaxed mb-4">{story.summary}</p>
                    </div>
                    <span className="text-xs text-warm-400">Published {new Date(story.created_at).toLocaleDateString()}</span>
                  </div>
                ))}

                {activeTab === 'characters' && tabItems.map((char) => (
                  <div key={char.id} className="p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-100 dark:border-warm-800 shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-500 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      🎭
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-warm-900 dark:text-white mb-1">{char.short_description || 'Unnamed Character'}</h3>
                      <p className="text-xs text-warm-500 mb-2">Category: {char.category || 'General'}</p>
                      <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-2 leading-relaxed mb-3">{char.long_description || char.greeting}</p>
                      <div className="flex gap-4 text-xs font-semibold text-warm-500">
                        <span>💬 {char.chats_count || 0} chats</span>
                        <span>❤️ {char.likes_count || 0} likes</span>
                      </div>
                    </div>
                  </div>
                ))}

                {activeTab === 'worlds' && tabItems.map((world) => (
                  <div key={world.id} className="p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-100 dark:border-warm-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-2xl mb-2">🗺️</div>
                      <h3 className="font-serif text-base font-bold text-warm-900 dark:text-white mb-1">{world.name}</h3>
                      <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-3">{world.description}</p>
                    </div>
                    <span className="text-xs text-warm-400">Created {new Date(world.created_at).toLocaleDateString()}</span>
                  </div>
                ))}

                {activeTab === 'lorebooks' && tabItems.map((lore) => (
                  <div key={lore.id} className="p-5 bg-white dark:bg-warm-850 rounded-2xl border border-warm-100 dark:border-warm-800 shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warm-100 dark:bg-warm-800 text-warm-500 flex items-center justify-center text-xl flex-shrink-0">
                      📖
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-warm-900 dark:text-white mb-1">{lore.title}</h3>
                      <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-2 leading-relaxed mb-2">{lore.description}</p>
                      <span className="text-xs bg-warm-100 dark:bg-warm-850 text-warm-500 px-2.5 py-0.5 rounded-full font-semibold border border-warm-200/50 dark:border-warm-750">{lore.entry_count || 0} entries</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <FollowListModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal(prev => ({ ...prev, isOpen: false }))}
        userId={profile.user_id}
        type={followModal.type}
      />
      <PhotoUpload
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        currentPhotoUrl={profile.photo_url}
        onPhotoUpdated={handlePhotoUpdated}
      />
      <BannerUpload
        isOpen={showBannerUpload}
        onClose={() => setShowBannerUpload(false)}
        currentBannerUrl={profile.banner_url || null}
        onBannerUpdated={handleBannerUpdated}
      />
      {showModerationModal && (
        <ModerationModal
          onClose={() => setShowModerationModal(false)}
          targetUserId={profile.user_id}
          targetUsername={profile.username || 'unknown'}
          contentType={moderationType}
          onSuccess={() => {
            if (moderationType === 'user') {
              navigate('/feed');
            }
          }}
        />
      )}
    </div>
  );
}
