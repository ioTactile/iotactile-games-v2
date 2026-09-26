import { describe, expect, it } from 'vitest';

import { makeQueryClient } from './query-client';

describe('query-client', () => {
  it('makeQueryClient retourne une instance QueryClient', () => {
    const client = makeQueryClient();
    expect(client).toBeDefined();
    expect(typeof client.getQueryCache).toBe('function');
    expect(typeof client.getMutationCache).toBe('function');
  });

  it('chaque appel crée une nouvelle instance', () => {
    const a = makeQueryClient();
    const b = makeQueryClient();
    expect(a).not.toBe(b);
  });
});
