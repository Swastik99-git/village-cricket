import { type Profile, ROLE_LABELS } from '../types';

interface PlayerAvatarProps {
  profile: Pick<Profile, 'photo_url' | 'full_name'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-base',
  lg: 'w-20 h-20 text-xl',
  xl: 'w-28 h-28 text-3xl',
};

export default function PlayerAvatar({ profile, size = 'md' }: PlayerAvatarProps) {
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (profile.photo_url) {
    return (
      <img
        src={profile.photo_url}
        alt={profile.full_name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-cricket-100 dark:ring-gray-700`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-cricket-500 to-cricket-700 text-white font-semibold flex items-center justify-center ring-2 ring-cricket-100 dark:ring-gray-700`}
    >
      {initials || '?'}
    </div>
  );
}

export { ROLE_LABELS };
