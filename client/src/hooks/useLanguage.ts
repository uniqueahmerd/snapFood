import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguageStore } from '../store/language.store';

export function useLanguage() {
  const { i18n } = useTranslation();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isSpeaking = useLanguageStore((state) => state.isSpeaking);
  const changeLanguage = useLanguageStore((state) => state.changeLanguage);
  const speak = useLanguageStore((state) => state.speak);
  const stopSpeaking = useLanguageStore((state) => state.stopSpeaking);

  useEffect(() => {
    void i18n.changeLanguage(currentLanguage);
  }, [currentLanguage, i18n]);

  return { currentLanguage, changeLanguage, speak, isSpeaking, stopSpeaking };
}