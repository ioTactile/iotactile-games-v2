import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { I18nProvider, useI18n } from '@/i18n/I18nProvider';

describe('I18nProvider', () => {
  it('retourne les traductions françaises par défaut', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    expect(result.current.t('home.title')).toBe('Choisissez un jeu');
    expect(result.current.t('auth.login')).toBe('Se connecter');
  });

  it('permet de changer de langue', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.t('home.title')).toBe('Choose a game');
    expect(result.current.t('auth.login')).toBe('Sign in');
  });
});
