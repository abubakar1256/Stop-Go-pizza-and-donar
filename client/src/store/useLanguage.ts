import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../i18n';

type LanguageState = {
  language: Language;
  setLanguage: (language: Language) => void;
};

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'sg-language' },
  ),
);
