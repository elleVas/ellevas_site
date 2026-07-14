import { translations, defaultLang, type Lang } from './translations';

/**
 * Extract language from URL pathname.
 * /it/... → 'it', everything else → 'en'
 */
export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (Object.hasOwn(translations, lang)) return lang as Lang;
  return defaultLang;
}

/**
 * Get translation function for a given language.
 */
export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof translations)['en']): string {
    return translations[lang][key] || translations[defaultLang][key] || key;
  };
}

/**
 * Build a localized path.
 * EN (default) → /path
 * IT → /it/path
 */
export function localizedPath(lang: Lang, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return cleanPath;
  return `/${lang}${cleanPath}`;
}

/**
 * Get the alternate language path (for the toggle button).
 */
export function getAlternatePath(currentUrl: URL): { lang: Lang; path: string } {
  const currentLang = getLangFromUrl(currentUrl);
  const targetLang: Lang = currentLang === 'en' ? 'it' : 'en';

  // Strip the current locale prefix if present
  let pathname = currentUrl.pathname;
  if (pathname.startsWith('/it/')) {
    pathname = pathname.slice(3) || '/';
  } else if (pathname === '/it') {
    pathname = '/';
  }

  return {
    lang: targetLang,
    path: localizedPath(targetLang, pathname),
  };
}
