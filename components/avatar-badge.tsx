import { cn } from '@/lib/utils';

interface AvatarBadgeProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarBadge({ name, size = 'md' }: AvatarBadgeProps) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeConfig = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  const hashCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hashCode % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        sizeConfig[size],
        bgColor
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
