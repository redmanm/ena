import { cn } from '@/lib/utils';

import type { UserRole } from '@/lib/types';

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const roleConfig: Record<string, { bg: string; text: string }> = {
    Manager: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Reception: { bg: 'bg-green-100', text: 'text-green-700' },
    Security: { bg: 'bg-red-100', text: 'text-red-700' },
    Admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
    Viewer: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const config = roleConfig[role] || roleConfig['Reception'];

  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', config.bg, config.text)}>
      {role}
    </span>
  );
}
