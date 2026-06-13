import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { Profile } from '../../types';
import { Avatar } from '../common/Avatar';
import { MoodBadge } from '../common/MoodBadge';
import UserBadges from '../common/UserBadges';

interface UserCardProps {
  profile: Profile;
  currentUserId: string;
  currentInterests: string[];
  onFollowToggle: () => void;
  isFollowing: boolean;
}

export function UserCard({
  profile,
  currentInterests,
  onFollowToggle,
  isFollowing,
}: UserCardProps) {
  const navigate = useNavigate();

  // Calculate shared interests
  const sharedInterests = profile.interests.filter(interest =>
    currentInterests.includes(interest)
  );

  // Calculate vibe match percentage
  const vibeMatchPercentage = Math.round(
    (sharedInterests.length / Math.max(7, currentInterests.length)) * 100
  );

  // Handle card click to navigate to profile
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the follow button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/profile/${profile.username}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="card cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden"
    >
      {/* Header with Avatar and Vibe Match */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar
          emoji={profile.avatar_emoji}
          photoUrl={profile.photo_url}
          size="lg"
        />
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-warm-900 dark:text-warm-50 flex items-center">
            {profile.display_name}
            <UserBadges badges={profile.badges} size="sm" />
          </h3>
          <p className="text-sm text-warm-600 dark:text-warm-400">
            @{profile.username}
          </p>
          {profile.mood && (
            <div className="mt-2">
              <MoodBadge mood={profile.mood} size="sm" />
            </div>
          )}
        </div>

        {/* Vibe Match Circle */}
        <div className="flex flex-col items-center">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="transform -rotate-90" width="56" height="56">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-warm-200 dark:text-warm-700"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${(vibeMatchPercentage / 100) * 150.8} 150.8`}
                className="text-accent-500 transition-all duration-300"
              />
            </svg>
            <div className="absolute text-center">
              <span className="block text-xs font-bold text-accent-600 dark:text-accent-400">
                {vibeMatchPercentage}%
              </span>
            </div>
          </div>
          <p className="text-xs text-warm-600 dark:text-warm-400 mt-1">Vibe</p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-warm-700 dark:text-warm-300 mb-3 line-clamp-2">
          {profile.bio}
        </p>
      )}

      {/* Shared Interests */}
      {sharedInterests.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-warm-600 dark:text-warm-400 mb-2 flex items-center gap-1">
            <Users size={14} />
            {sharedInterests.length} shared interest{sharedInterests.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-1">
            {sharedInterests.map((interest, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                  bg-primary-100 text-primary-700
                  dark:bg-primary-900 dark:text-primary-200"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Follow Button */}
      <button
        onClick={onFollowToggle}
        className={`w-full py-2.5 px-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
          isFollowing
            ? 'btn-secondary'
            : 'btn-primary'
        }`}
      >
        {isFollowing ? 'Following' : 'Connect'}
      </button>
    </div>
  );
}
