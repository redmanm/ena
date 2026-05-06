import en from '@/locales/en.json';
import am from '@/locales/am.json';

export type Language = 'en' | 'am';

const translations = {
  en,
  am,
};

export function getTranslation(lang: Language, key: string, defaultValue: string = ''): string {
  try {
    const keys = key.split('.');
    let value: any = translations[lang];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return typeof value === 'string' ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function detectBrowserLanguage(): Language {
  // Check if browser language is Amharic
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // Check for Amharic language codes
  if (browserLang.startsWith('am')) {
    return 'am';
  }
  
  // Detect if user is likely in Ethiopia based on timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Africa/Addis_Ababa') {
      return 'am';
    }
  } catch {
    // Ignore timezone detection errors
  }
  
  return 'en';
}

export function getStoredLanguage(): Language | null {
  if (typeof localStorage === 'undefined') return null;
  const stored = localStorage.getItem('language');
  return (stored === 'am' || stored === 'en') ? stored : null;
}

export function setStoredLanguage(lang: Language): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('language', lang);
  }
}

export function initializeLanguage(): Language {
  const stored = getStoredLanguage();
  if (stored) return stored;
  return detectBrowserLanguage();
}
