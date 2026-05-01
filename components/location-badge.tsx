import { cn } from '@/lib/utils';

interface LocationBadgeProps {
  location: 'ENA' | 'POA' | 'Both' | 'Admin';
}

export function LocationBadge({ location }: LocationBadgeProps) {
  const locationConfig: Record<string, { bg: string; text: string }> = {
    'ENA': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'POA': { bg: 'bg-purple-100', text: 'text-purple-700' },
    'Both': { bg: 'bg-green-100', text: 'text-green-700' },
    'Admin': { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const config = locationConfig[location] || locationConfig['ENA'];

  return (
    <span className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 backdrop-blur-sm', config.bg, config.text)}>
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      </svg>
      {location}
    </span>
  );
}
