import { useNavigate } from 'react-router-dom';
import type { Profile } from '../../types';
import { Avatar } from '../common/Avatar';
import { UserBadges } from '../common/UserBadges';

interface UserCardProps {
  profile: Profile;
  currentUserId: string;
  onFollowToggle: () => void;
  isFollowing: boolean;
  // currentInterests kept for backward compatibility but no longer used for display
  currentInterests?: string[];
}

export function UserCard({
  profile,
  onFollowToggle,
  isFollowing,
}: UserCardProps) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/profile/${profile.username}`);
  };

  // Show creative specialties from the profile
  const creativeSpecialties = (profile.interests || []).slice(0, 3);

  return (
    <div
      onClick={handleCardClick}
      className="card cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden"
    >
      {/* Header with Avatar and Role */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar
          photoUrl={profile.photo_url}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-semibold text-warm-900 dark:text-warm-50 flex items-center">
            {profile.display_name}
            <UserBadges badges={profile.badges} role={profile.role} size="sm" />
          </h3>
          <p className="text-sm text-warm-600 dark:text-warm-400">
            @{profile.username}
          </p>
          {profile.creator_role_1 && (
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5">
              {profile.creator_role_1}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-warm-700 dark:text-warm-300 mb-3 line-clamp-2">
          {profile.bio}
        </p>
      )}

      {/* Creative Specialties */}
      {creativeSpecialties.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {creativeSpecialties.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                bg-primary-100 text-primary-700
                dark:bg-primary-900 dark:text-primary-200"
            >
              {tag}
            </span>
          ))}
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
