import { useAuth } from './auth-context';
import { hasPermission, hasAnyPermission, hasAllPermissions, getVisibleMenuItems, type Permission } from './permissions';

export function usePermissions() {
  const { user } = useAuth();

  if (!user) {
    return {
      can: () => false,
      canAny: () => false,
      canAll: () => false,
      getMenuItems: () => [],
      role: null,
    };
  }

  return {
    can: (permission: Permission) => hasPermission(user.role, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(user.role, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(user.role, permissions),
    getMenuItems: () => getVisibleMenuItems(user.role),
    role: user.role,
  };
}
