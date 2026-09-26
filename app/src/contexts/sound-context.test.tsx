import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SoundProvider, useSound } from './sound-context';

describe('SoundContext', () => {
  const storage: Record<string, string> = {};
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((k) => {
          delete storage[k];
        });
      },
      length: 0,
      key: () => null,
    });
    storage['dice-sound-muted'] = 'false';
  });

  it('useSound sans provider retourne muted: false et toggleMuted no-op', () => {
    const { result } = renderHook(() => useSound());
    expect(result.current.muted).toBe(false);
    act(() => {
      result.current.toggleMuted();
    });
    expect(result.current.muted).toBe(false);
  });

  it('avec SoundProvider, toggleMuted alterne muted et persiste en localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SoundProvider>{children}</SoundProvider>
    );
    const { result } = renderHook(() => useSound(), { wrapper });
    expect(result.current.muted).toBe(false);

    act(() => {
      result.current.toggleMuted();
    });
    expect(result.current.muted).toBe(true);
    expect(storage['dice-sound-muted']).toBe('true');

    act(() => {
      result.current.toggleMuted();
    });
    expect(result.current.muted).toBe(false);
    expect(storage['dice-sound-muted']).toBe('false');
  });
});
