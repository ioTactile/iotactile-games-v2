import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMe, login, logout, refresh, register } from './auth-api';

vi.mock('@/lib/api/api-client', () => ({
  getApiUrl: vi.fn(() => 'https://api.test'),
  defaultFetchOptions: {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  },
}));

describe('auth-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('retourne ok et data quand la réponse est 200', async () => {
      const data = { accessToken: 'token', user: { id: '1', email: 'a@b.com' } };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      const result = await login({ email: 'a@b.com', password: 'p' });

      expect(result).toEqual({ ok: true, data });
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'a@b.com', password: 'p' }),
        }),
      );
    });

    it("retourne ok false et error quand la réponse n'est pas ok", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      const result = await login({ email: 'a@b.com', password: 'p' });

      expect(result).toEqual({ ok: false, error: 'Invalid credentials' });
    });
  });

  describe('register', () => {
    it('retourne ok et data quand la réponse est 200', async () => {
      const user = { id: '1', email: 'a@b.com', username: 'u' };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(user),
      });

      const result = await register({
        email: 'a@b.com',
        username: 'u',
        password: 'p',
      });

      expect(result).toEqual({ ok: true, data: user });
    });

    it("retourne ok false avec message par défaut si pas d'error dans le body", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const result = await register({
        email: 'a@b.com',
        username: 'u',
        password: 'p',
      });

      expect(result.ok).toBe(false);
      expect((result as { error: string }).error).toContain('inscription');
    });
  });

  describe('logout', () => {
    it('appelle POST /auth/logout', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

      await logout();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test/auth/logout',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('getMe', () => {
    it('retourne ok et data avec Authorization Bearer', async () => {
      const user = { id: '1', email: 'a@b.com', username: 'u' };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(user),
      });

      const result = await getMe('access-token');

      expect(result).toEqual({ ok: true, data: user });
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        }),
      );
    });

    it('retourne ok false si non authentifié', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const result = await getMe('bad-token');

      expect(result).toEqual({ ok: false, error: 'Unauthorized' });
    });
  });

  describe('refresh', () => {
    it('retourne ok et accessToken + expiresInSeconds', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            accessToken: 'new-token',
            expiresInSeconds: 900,
          }),
      });

      const result = await refresh();

      expect(result).toEqual({
        ok: true,
        accessToken: 'new-token',
        expiresInSeconds: 900,
      });
    });

    it("retourne ok false si la réponse n'est pas ok", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const result = await refresh();

      expect(result).toEqual({ ok: false });
    });
  });
});
