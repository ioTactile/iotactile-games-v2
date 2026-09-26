import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultFetchOptions, getApiUrl, getWsUrl } from './api-client';

describe('api-client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getApiUrl', () => {
    it('retourne NEXT_PUBLIC_API_URL', () => {
      expect(getApiUrl()).toBe('https://api.example.com');
    });
  });

  describe('defaultFetchOptions', () => {
    it('inclut credentials include et Content-Type json', () => {
      expect(defaultFetchOptions.credentials).toBe('include');
      expect(defaultFetchOptions.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      );
    });
  });

  describe('getWsUrl', () => {
    it("remplace http par ws dans l'URL de base", () => {
      expect(getWsUrl('/dice/ws')).toBe('wss://api.example.com/dice/ws');
    });

    it('ajoute un slash devant le path si absent', () => {
      expect(getWsUrl('dice/ws')).toBe('wss://api.example.com/dice/ws');
    });

    it('évite le double slash si la base se termine par /', () => {
      vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com/');
      expect(getWsUrl('/dice/ws')).toBe('wss://api.example.com/dice/ws');
    });
  });
});
