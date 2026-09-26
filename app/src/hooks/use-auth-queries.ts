'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as authApi from '@/lib/auth/auth-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { User } from '@/types/auth';

/**
 * Session: calls POST /auth/refresh (cookie) and caches the accessToken.
 * Single source of truth for "do I have a token?" — replaces the store.
 */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: async (): Promise<string | null> => {
      const result = await authApi.refresh();
      return result.ok ? result.accessToken : null;
    },
    staleTime: Infinity,
    retry: false,
  });
}

/**
 * Fetches the current user (GET /auth/me) with TanStack Query cache.
 * Token is read from the session cache inside queryFn — stable key without accessToken.
 * Pass accessToken (useSession().data) for enabled.
 */
export function useMe(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async (): Promise<User> => {
      const token = queryClient.getQueryData<string | null>(queryKeys.auth.session());
      if (!token) throw new Error('No token');
      const result = await authApi.getMe(token);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(accessToken),
  });
}

/**
 * Login mutation (POST /auth/login).
 * On success: updates session + me cache (no store).
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) => authApi.login(credentials),
    onSuccess: async (result) => {
      if (!result.ok) return;
      const { accessToken } = result.data;
      queryClient.setQueryData(queryKeys.auth.session(), accessToken);

      const meResult = await authApi.getMe(accessToken);
      if (meResult.ok) {
        queryClient.setQueryData(queryKeys.auth.me(), meResult.data);
      }
    },
  });
}

/**
 * Register mutation (POST /auth/register).
 * On success, invalidates the auth cache (optional, for consistency).
 */
export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: {
      email: string;
      password: string;
      username: string;
      role?: 'ADMIN' | 'USER';
    }) => authApi.register(credentials),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      }
    },
  });
}

/**
 * Logout mutation (POST /auth/logout).
 * Clears session + me cache immediately so the login page shows without waiting.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.session(), null);
      queryClient.setQueryData(queryKeys.auth.me(), null);
    },
  });
}
