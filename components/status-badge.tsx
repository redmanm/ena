import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status:
    | 'Confirmed'
    | 'Scheduled'
    | 'Pending'
    | 'Cancelled'
    | 'Checked In'
    | 'CheckedIn'
    | 'CheckedOut'
    | 'Walk-in'
    | 'Active'
    | 'Inactive';
  variant?: 'default' | 'outline';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const statusConfig: Record<string, { bg: string; text: string; border?: string }> = {
    Confirmed: { bg: 'bg-green-100', text: 'text-green-700' },
    Scheduled: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    Pending: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
    'Checked In': { bg: 'bg-blue-100', text: 'text-blue-700' },
    CheckedIn: { bg: 'bg-blue-100', text: 'text-blue-700' },
    CheckedOut: { bg: 'bg-slate-100', text: 'text-slate-700' },
    'Walk-in': { bg: 'bg-amber-100', text: 'text-amber-700' },
    Active: { bg: 'bg-green-100', text: 'text-green-700' },
    Inactive: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const label =
    status === 'CheckedIn' ? 'Checked In' : status === 'CheckedOut' ? 'Checked Out' : status;
  const config = statusConfig[status] || statusConfig['Pending'];

  if (variant === 'outline') {
    return (
      <span className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-300 hover:shadow-md', config.text, 'border-current/30 hover:bg-white/50')}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {label}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105', config.bg, config.text)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
