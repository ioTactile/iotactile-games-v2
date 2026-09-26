import {
  useLoginMutation,
  useLogoutMutation,
  useMe,
  useRegisterMutation,
  useSession,
} from '@/hooks/use-auth-queries';

/**
 * Hook to manage authentication.
 * Everything lives in React Query: session (accessToken via cookie) + me (user).
 */
export function useAuth() {
  const { data: accessToken, isFetched: isInitialized } = useSession();
  const { data: user, isLoading: userLoading, error: userError } = useMe(accessToken ?? null);

  const isAuthenticated = Boolean(accessToken);

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  return {
    user: user ?? null,
    userLoading,
    userError,
    accessToken: accessToken ?? null,
    isAuthenticated,
    isInitialized,
    loginMutation,
    registerMutation,
    logoutMutation,
  };
}
