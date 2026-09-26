import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '@/lib/auth/auth-api';
import { queryKeys } from '@/lib/query/query-keys';

import {
  useLoginMutation,
  useLogoutMutation,
  useMe,
  useRegisterMutation,
} from './use-auth-queries';

vi.mock('@/lib/auth/auth-api');

function createWrapper(initialSessionToken?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (initialSessionToken) {
    queryClient.setQueryData(queryKeys.auth.session(), initialSessionToken);
  }
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('use-auth-queries', () => {
  const mockUser = {
    id: 'user-1',
    email: 'u@test.com',
    username: 'user1',
    role: 'USER' as const,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMe', () => {
    it('ne lance pas la requête si accessToken est null', () => {
      const { result } = renderHook(() => useMe(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isPending).toBe(true);
      expect(authApi.getMe).not.toHaveBeenCalled();
    });

    it('appelle getMe et retourne le user quand accessToken est fourni', async () => {
      vi.mocked(authApi.getMe).mockResolvedValue({ ok: true, data: mockUser });

      const { result } = renderHook(() => useMe('token-123'), {
        wrapper: createWrapper('token-123'),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(authApi.getMe).toHaveBeenCalledWith('token-123');
      expect(result.current.data).toEqual(mockUser);
    });

    it('retourne une erreur si getMe échoue', async () => {
      vi.mocked(authApi.getMe).mockResolvedValue({
        ok: false,
        error: 'Non authentifié.',
      });

      const { result } = renderHook(() => useMe('token-123'), {
        wrapper: createWrapper('token-123'),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useLoginMutation', () => {
    it('appelle login avec les credentials et retourne le résultat', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        ok: true,
        data: {
          accessToken: 'access-123',
          tokenType: 'Bearer',
          expiresInSeconds: 900,
        },
      });

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ email: 'u@test.com', password: 'pass' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'u@test.com',
        password: 'pass',
      });
      expect(result.current.data?.ok).toBe(true);
    });
  });

  describe('useRegisterMutation', () => {
    it('appelle register avec les credentials et retourne le user', async () => {
      vi.mocked(authApi.register).mockResolvedValue({
        ok: true,
        data: mockUser,
      });

      const { result } = renderHook(() => useRegisterMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        email: 'u@test.com',
        password: 'Pass123',
        username: 'user1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(authApi.register).toHaveBeenCalledWith({
        email: 'u@test.com',
        password: 'Pass123',
        username: 'user1',
      });
      expect(result.current.data?.ok).toBe(true);
    });
  });

  describe('useLogoutMutation', () => {
    it('appelle logout', async () => {
      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useLogoutMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(authApi.logout).toHaveBeenCalled();
    });
  });
});
