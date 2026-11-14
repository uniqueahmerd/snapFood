import { create } from 'zustand';

export type Language = 'en' | 'ha' | 'yo' | 'ig' | 'fr';

interface LanguageState {
  currentLanguage: Language;
  isSpeaking: boolean;
  changeLanguage: (language: Language) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

const LANGUAGES: Language[] = ['en', 'ha', 'yo', 'ig', 'fr'];

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('snapfood_language');
  return LANGUAGES.includes(saved as Language) ? (saved as Language) : 'en';
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: getInitialLanguage(),
  isSpeaking: false,

  changeLanguage: (language) => {
    localStorage.setItem('snapfood_language', language);
    set({ currentLanguage: language });
  },

  speak: (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceLanguage: Record<Language, string> = {
      en: 'en-US',
      ha: 'en-US',
      yo: 'en-US',
      ig: 'en-US',
      fr: 'fr-FR',
    };

    utterance.lang = voiceLanguage[get().currentLanguage];
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    utterance.onstart = () => set({ isSpeaking: true });
    utterance.onend = () => set({ isSpeaking: false });
    utterance.onerror = () => set({ isSpeaking: false });
    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    set({ isSpeaking: false });
  },
}));