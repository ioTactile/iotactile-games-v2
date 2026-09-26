import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getOrCreateGuestId } from './guest-id';

describe('getOrCreateGuestId', () => {
  const storage: Record<string, string> = {};

  beforeEach(() => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        for (const k of Object.keys(storage)) delete storage[k];
      },
      length: 0,
      key: () => null,
    });
    vi.stubGlobal('crypto', {
      randomUUID: () => 'uuid-test-123',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retourne une chaîne vide quand window est undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(getOrCreateGuestId()).toBe('');
  });

  it('crée et persiste un nouvel UUID si aucun en localStorage', () => {
    const id = getOrCreateGuestId();
    expect(id).toBe('uuid-test-123');
    expect(storage['dice_guest_id']).toBe('uuid-test-123');
  });

  it("retourne l'UUID existant du localStorage sans en créer un nouveau", () => {
    storage['dice_guest_id'] = 'existing-uuid';
    expect(getOrCreateGuestId()).toBe('existing-uuid');
    expect(storage['dice_guest_id']).toBe('existing-uuid');
  });
});
