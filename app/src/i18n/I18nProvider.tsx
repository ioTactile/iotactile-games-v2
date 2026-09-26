'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { defaultLanguage, isSupportedLanguage, type Language } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import type { Dictionary } from '@/i18n/dictionary.type';

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, ...args: unknown[]) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'iotactile-language';

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return defaultLanguage;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isSupportedLanguage(stored)) {
    return stored;
  }

  return defaultLanguage;
};

const getValueFromDictionary = (
  dictionary: Dictionary,
  key: string,
  args: unknown[] = [],
): string => {
  const segments = key.split('.');
  let current: unknown = dictionary;

  for (const segment of segments) {
    if (current == null || typeof current !== 'object' || !(segment in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (typeof current === 'function') {
    return current(...args);
  }

  return typeof current === 'string' ? current : key;
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const dictionary = useMemo(() => getDictionary(language), [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const t = useCallback(
    (key: string, ...args: unknown[]): string => getValueFromDictionary(dictionary, key, args),
    [dictionary],
  );

  const value: I18nContextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};
