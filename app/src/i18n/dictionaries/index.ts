import type { Language } from '@/i18n/config';
import { enDictionary } from '@/i18n/dictionaries/en';
import { frDictionary } from '@/i18n/dictionaries/fr';
import type { Dictionary } from '@/i18n/dictionary.type';

const dictionaries: Record<Language, Dictionary> = {
  fr: frDictionary,
  en: enDictionary,
};

export const getDictionary = (language: Language): Dictionary => dictionaries[language];
