import { describe, expect, it } from 'vitest';

import { queryKeys } from './query-keys';

describe('query-keys', () => {
  it('auth.all est un tableau de clés', () => {
    expect(queryKeys.auth.all).toEqual(['auth']);
  });

  it('auth.me() retourne la clé pour la requête me', () => {
    expect(queryKeys.auth.me()).toEqual(['auth', 'me']);
  });
});
