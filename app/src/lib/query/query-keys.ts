/**
 * TanStack Query keys for cache invalidation.
 * One key per resource or API route.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    /** Session = accessToken (via POST /auth/refresh with cookie). */
    session: () => [...queryKeys.auth.all, 'session'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  dice: {
    all: ['dice'] as const,
    session: (sessionId: string) => [...queryKeys.dice.all, 'session', sessionId] as const,
    mySessions: (guestId: string | undefined | null, accessToken: string | null) =>
      [...queryKeys.dice.all, 'mySessions', guestId ?? null, accessToken ?? null] as const,
    publicSessions: () => [...queryKeys.dice.all, 'publicSessions'] as const,
  },
} as const;
