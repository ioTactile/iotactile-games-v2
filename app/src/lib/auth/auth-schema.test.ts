import { describe, expect, it } from 'vitest';

import { loginFormSchema, registerFormSchema } from './auth-schema';

describe('loginFormSchema', () => {
  it('valide un email et mot de passe corrects', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.password).toBe('secret123');
    }
  });

  it('rejette un email invalide', () => {
    const result = loginFormSchema.safeParse({
      email: 'not-an-email',
      password: 'p',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe vide', () => {
    const result = loginFormSchema.safeParse({
      email: 'u@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it("normalise l'email en minuscules", () => {
    const result = loginFormSchema.safeParse({
      email: 'User@Example.COM',
      password: 'x',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });
});

describe('registerFormSchema', () => {
  it('valide email, username et mot de passe conformes', () => {
    const result = registerFormSchema.safeParse({
      email: 'user@example.com',
      username: 'MonPseudo',
      password: 'Secret123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.username).toBe('MonPseudo');
      expect(result.data.password).toBe('Secret123');
    }
  });

  it('rejette un mot de passe trop court', () => {
    const result = registerFormSchema.safeParse({
      email: 'u@example.com',
      username: 'u',
      password: 'Ab1',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe sans lettre', () => {
    const result = registerFormSchema.safeParse({
      email: 'u@example.com',
      username: 'user',
      password: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un username trop court', () => {
    const result = registerFormSchema.safeParse({
      email: 'u@example.com',
      username: 'x',
      password: 'Secret123',
    });
    expect(result.success).toBe(false);
  });
});
