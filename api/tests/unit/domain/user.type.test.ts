import { describe, expect, it } from 'vitest';
import { Role } from '@/domain/user/user.type.ts';

describe('user.type', () => {
  describe('Role', () => {
    it('expose ADMIN et USER', () => {
      expect(Role.ADMIN).toBe('ADMIN');
      expect(Role.USER).toBe('USER');
    });
  });
});
