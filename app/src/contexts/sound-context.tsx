'use client';

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

const STORAGE_KEY = 'dice-sound-muted';

type SoundContextValue = {
  muted: boolean;
  toggleMuted: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

function readStoredMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(() => readStoredMuted());

  const toggleMuted = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return <SoundContext.Provider value={{ muted, toggleMuted }}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      muted: false,
      toggleMuted: () => {},
    };
  }
  return ctx;
}
