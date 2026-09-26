export const languages = ['fr', 'en'] as const;

export type Language = (typeof languages)[number];

export const defaultLanguage: Language = 'fr';

export const isSupportedLanguage = (value: string | null | undefined): value is Language =>
  value != null && languages.includes(value as Language);
