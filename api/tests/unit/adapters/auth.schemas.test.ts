import { describe, expect, it } from 'vitest';
import {
  loginBodySchema,
  registerBodySchema,
} from '@/adapters/primary/http/schemas/auth.schemas.ts';

describe('auth.schemas', () => {
  describe('registerBodySchema', () => {
    it('valide un body correct', () => {
      const result = registerBodySchema.safeParse({
        email: 'user@example.com',
        password: 'Password1',
        username: 'myuser',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
        expect(result.data.username).toBe('myuser');
        expect(result.data.role).toBeUndefined();
      }
    });

    it('accepte role ADMIN optionnel', () => {
      const result = registerBodySchema.safeParse({
        email: 'a@b.com',
        password: 'Pass1word',
        username: 'admin',
        role: 'ADMIN',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('ADMIN');
      }
    });

    it('rejette un email invalide', () => {
      const result = registerBodySchema.safeParse({
        email: 'not-an-email',
        password: 'Password1',
        username: 'u',
      });
      expect(result.success).toBe(false);
    });

    it('rejette un mot de passe trop court', () => {
      const result = registerBodySchema.safeParse({
        email: 'u@example.com',
        password: 'Short1',
        username: 'u',
      });
      expect(result.success).toBe(false);
    });

    it('rejette un mot de passe sans chiffre', () => {
      const result = registerBodySchema.safeParse({
        email: 'u@example.com',
        password: 'OnlyLetters',
        username: 'u',
      });
      expect(result.success).toBe(false);
    });

    it('rejette un mot de passe sans lettre', () => {
      const result = registerBodySchema.safeParse({
        email: 'u@example.com',
        password: '12345678',
        username: 'u',
      });
      expect(result.success).toBe(false);
    });

    it('rejette un username trop court', () => {
      const result = registerBodySchema.safeParse({
        email: 'u@example.com',
        password: 'Password1',
        username: 'u',
      });
      expect(result.success).toBe(false);
    });

    it('normalise email en minuscules', () => {
      const result = registerBodySchema.safeParse({
        email: 'User@example.com',
        password: 'Password1',
        username: 'us',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });
  });

  describe('loginBodySchema', () => {
    it('valide un body correct', () => {
      const result = loginBodySchema.safeParse({
        email: 'user@example.com',
        password: 'any',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
        expect(result.data.password).toBe('any');
      }
    });

    it('rejette un email invalide', () => {
      const result = loginBodySchema.safeParse({
        email: 'invalid',
        password: 'p',
      });
      expect(result.success).toBe(false);
    });

    it('rejette un mot de passe vide', () => {
      const result = loginBodySchema.safeParse({
        email: 'u@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
