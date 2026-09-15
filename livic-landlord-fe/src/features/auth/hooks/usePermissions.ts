import { useMemo } from 'react';

import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { canAccessRoute, hasPermission } from '@/src/features/auth/permissions';

export function usePermissions() {
  const { context } = useAuth();

  return useMemo(() => ({
    isLoaded: context !== null,
    can: (code: string, propertyId?: string | null) => hasPermission(context, [code], propertyId),
    canRoute: (route: string) => canAccessRoute(context, route),
  }), [context]);
}
