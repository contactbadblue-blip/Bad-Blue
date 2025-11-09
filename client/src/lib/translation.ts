// Translation service using MyMemory API (free, no API key required)

export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇺🇸' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸' },
  zh: { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  vi: { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  ar: { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ru: { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  tl: { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ko: { code: 'ko', name: '한국어', flag: '🇰🇷' },
  hi: { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  de: { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// In-memory cache for translations
const translationCache = new Map<string, string>();

function getCacheKey(text: string, from: string, to: string): string {
  return `${from}|${to}|${text}`;
}

/**
 * Translate text using MyMemory API
 * @param text - Text to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code (default: 'en')
 */
export async function translateText(
  text: string,
  targetLang: LanguageCode,
  sourceLang: LanguageCode = 'en'
): Promise<string> {
  // Don't translate if source and target are the same
  if (sourceLang === targetLang) {
    return text;
  }

  // Don't translate empty strings
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Check cache first
  const cacheKey = getCacheKey(text, sourceLang, targetLang);
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // MyMemory API - free, no API key required
    const sourceCode = SUPPORTED_LANGUAGES[sourceLang].code;
    const targetCode = SUPPORTED_LANGUAGES[targetLang].code;
    
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${targetCode}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[Translation] API request failed:', response.statusText);
      return text; // Return original text on error
    }

    const data = await response.json();
    
    if (data.responseStatus !== 200) {
      console.error('[Translation] API returned error:', data.responseStatus);
      return text;
    }

    const translatedText = data.responseData.translatedText;
    
    // Cache the result
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.error('[Translation] Error translating text:', error);
    return text; // Return original text on error
  }
}

/**
 * Translate multiple texts in batch (with delays to avoid rate limiting)
 */
export async function translateBatch(
  texts: string[],
  targetLang: LanguageCode,
  sourceLang: LanguageCode = 'en'
): Promise<string[]> {
  const results: string[] = [];
  
  for (const text of texts) {
    const translated = await translateText(text, targetLang, sourceLang);
    results.push(translated);
    // Small delay to avoid rate limiting (MyMemory has rate limits)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Clear translation cache (useful for memory management)
 */
export function clearTranslationCache() {
  translationCache.clear();
}
