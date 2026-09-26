import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDiceSession,
  getDiceSession,
  getMyDiceSessions,
  getPublicDiceSessions,
  joinDiceSession,
  joinDiceSessionByCode,
  leaveDiceSession,
  startDiceSession,
} from './dice-api';

vi.mock('@/lib/api/api-client', () => ({
  getApiUrl: vi.fn(() => 'https://api.test'),
  defaultFetchOptions: {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  },
}));

describe('dice-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDiceSession', () => {
    it('retourne ok et data quand la réponse est 200', async () => {
      const session = {
        id: 's1',
        name: 'Ma partie',
        joinCode: 'ABC123',
        status: 'WAITING',
        createdAt: '',
        updatedAt: '',
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(session),
      });

      const result = await createDiceSession({ name: 'Ma partie' });

      expect(result).toEqual({ ok: true, data: session });
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test/dice/sessions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Ma partie' }),
        }),
      );
    });

    it('envoie isPublic, displayName et guestId si fournis', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ id: 's1', name: 'P', status: 'WAITING', createdAt: '', updatedAt: '' }),
      });

      await createDiceSession({
        name: 'P',
        isPublic: true,
        displayName: 'Alice',
        guestId: 'g1',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            name: 'P',
            isPublic: true,
            displayName: 'Alice',
            guestId: 'g1',
          }),
        }),
      );
    });
  });

  describe('joinDiceSession', () => {
    it('retourne ok quand la réponse est 200', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await joinDiceSession({
        sessionId: 's1',
        displayName: 'Bob',
        guestId: 'g2',
      });

      expect(result).toEqual({ ok: true });
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test/dice/sessions/s1/join',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ displayName: 'Bob', guestId: 'g2' }),
        }),
      );
    });
  });

  describe('joinDiceSessionByCode', () => {
    it('retourne ok et sessionId quand la réponse contient session.id', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { id: 's1' } }),
      });

      const result = await joinDiceSessionByCode({
        joinCode: 'abc123',
        displayName: 'Alice',
      });

      expect(result).toEqual({ ok: true, sessionId: 's1' });
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test/dice/sessions/join-by-code',
        expect.objectContaining({
          body: JSON.stringify({
            joinCode: 'ABC123',
            displayName: 'Alice',
          }),
        }),
      );
    });

    it("retourne ok false si la réponse n'a pas session.id", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await joinDiceSessionByCode({ joinCode: 'XYZ' });

      expect(result.ok).toBe(false);
      expect((result as { error: string }).error).toContain('invalide');
    });
  });

  describe('leaveDiceSession', () => {
    it('retourne ok quand la réponse est 200', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await leaveDiceSession({
        sessionId: 's1',
        guestId: 'g1',
      });

      expect(result).toEqual({ ok: true });
    });
  });

  describe('startDiceSession', () => {
    it('retourne ok quand la réponse est 200', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await startDiceSession({ sessionId: 's1' });

      expect(result).toEqual({ ok: true });
    });
  });

  describe('getMyDiceSessions', () => {
    it('retourne ok et data (tableau)', async () => {
      const list = [{ id: 's1', name: 'P', status: 'WAITING' }];
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(list),
      });

      const result = await getMyDiceSessions({ guestId: 'g1' });

      expect(result).toEqual({ ok: true, data: list });
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('guestId=g1'), expect.any(Object));
    });
  });

  describe('getPublicDiceSessions', () => {
    it('retourne ok et data (tableau)', async () => {
      const list = [{ id: 's1', name: 'P', joinCode: 'A1', status: 'WAITING' }];
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(list),
      });

      const result = await getPublicDiceSessions();

      expect(result).toEqual({ ok: true, data: list });
    });
  });

  describe('getDiceSession', () => {
    it('retourne ok et data quand la réponse est 200', async () => {
      const view = {
        session: { id: 's1', name: 'P', status: 'PLAYING', createdAt: '', updatedAt: '' },
        players: [],
        state: null,
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(view),
      });

      const result = await getDiceSession('s1');

      expect(result).toEqual({ ok: true, data: view });
      expect(fetch).toHaveBeenCalledWith('https://api.test/dice/sessions/s1', expect.any(Object));
    });

    it('retourne ok false avec status si 404', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      const result = await getDiceSession('s1');

      expect(result).toEqual({
        ok: false,
        error: 'Not found',
        status: 404,
      });
    });
  });
});
