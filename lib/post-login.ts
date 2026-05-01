import type { User } from '@/lib/types';

export function getPostLoginPath(
  user: Pick<User, 'role'> & { mustChangePassword?: boolean }
) {
  return '/dashboard';
}
