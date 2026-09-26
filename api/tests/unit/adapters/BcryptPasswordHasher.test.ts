import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '@/adapters/secondary/security/BcryptPasswordHasher.ts';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('hash retourne un hash différent du mot de passe clair', async () => {
    const result = await hasher.hash('MyPassword123');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toBe('MyPassword123');
      expect(result.value.length).toBeGreaterThan(0);
      expect(result.value).toMatch(/^\$2[aby]?\$/);
    }
  });

  it('compare retourne true pour le bon mot de passe', async () => {
    const hashResult = await hasher.hash('Secret123');
    expect(hashResult.ok).toBe(true);
    if (!hashResult.ok) return;
    const compareResult = await hasher.compare('Secret123', hashResult.value);
    expect(compareResult.ok).toBe(true);
    if (compareResult.ok) {
      expect(compareResult.value).toBe(true);
    }
  });

  it('compare retourne false pour un mauvais mot de passe', async () => {
    const hashResult = await hasher.hash('Secret123');
    expect(hashResult.ok).toBe(true);
    if (!hashResult.ok) return;
    const compareResult = await hasher.compare('WrongPassword', hashResult.value);
    expect(compareResult.ok).toBe(true);
    if (compareResult.ok) {
      expect(compareResult.value).toBe(false);
    }
  });

  it('hash produit des valeurs différentes à chaque appel (salt)', async () => {
    const r1 = await hasher.hash('SamePassword');
    const r2 = await hasher.hash('SamePassword');
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      expect(r1.value).not.toBe(r2.value);
    }
  });
});
