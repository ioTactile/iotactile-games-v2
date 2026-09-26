'use client';

import { useSession } from '@/hooks/use-auth-queries';

/**
 * Triggers the session query on mount (POST /auth/refresh with cookie).
 * Token is cached in React Query; no separate store.
 * Place inside the root layout.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useSession();

  return <>{children}</>;
}
