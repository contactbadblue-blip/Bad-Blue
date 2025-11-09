import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { LanguageCode, translateText } from '@/lib/translation';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (text: string) => Promise<string>;
  tSync: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    // Load language from localStorage or default to English
    const saved = localStorage.getItem('badblue_language');
    return (saved as LanguageCode) || 'en';
  });

  // Cache for synchronous translations - using ref to avoid recreating tSync
  const translationMapRef = useRef<Map<string, string>>(new Map());
  // State version for triggering re-renders when translations complete
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('badblue_language', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    // Clear translation cache when language changes
    translationMapRef.current = new Map();
    forceUpdate({});
  };

  // Async translation function - memoized to prevent infinite loops
  const t = useCallback(async (text: string): Promise<string> => {
    if (currentLanguage === 'en') {
      return text;
    }

    const cacheKey = `${currentLanguage}:${text}`;
    
    // Check cache first
    const cached = translationMapRef.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const translated = await translateText(text, currentLanguage, 'en');
      
      // Only update cache if not already there (avoid race conditions)
      if (!translationMapRef.current.has(cacheKey)) {
        translationMapRef.current.set(cacheKey, translated);
        forceUpdate({}); // Trigger re-render for components using tSync
      }
      
      return translated;
    } catch (error) {
      console.error('[Translation] Error:', error);
      return text;
    }
  }, [currentLanguage]);

  // Synchronous translation function (uses cache) - memoized with stable dependencies
  const tSync = useCallback((text: string): string => {
    if (currentLanguage === 'en') {
      return text;
    }

    const cacheKey = `${currentLanguage}:${text}`;
    const cached = translationMapRef.current.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // If not cached, trigger async translation via memoized t function
    void t(text);

    return text; // Return original text while translation loads
  }, [currentLanguage, t]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, tSync }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
