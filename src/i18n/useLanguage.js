import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { languages, languageStorageKey, translate } from './catalog.js';

export function useLanguage() {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem(languageStorageKey);
      return saved === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  });
  const scrollAnchor = useRef(null);

  const changeLanguage = (next) => {
    if (!languages[next] || next === language) return;
    const headerBottom = document.querySelector('.cabecera')?.getBoundingClientRect().bottom ?? 0;
    const sections = [...document.querySelectorAll('main section[id], footer[id]')];
    const readingLine = headerBottom + Math.max(0, window.innerHeight - headerBottom) * 0.35;
    const section = [...sections].reverse().find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top <= readingLine && rect.bottom > readingLine;
    }) ?? sections.find((element) => element.getBoundingClientRect().bottom > headerBottom + 1);
    if (section) scrollAnchor.current = { id: section.id, top: section.getBoundingClientRect().top };
    setLanguage(next);
  };

  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.title = languages[language].meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', languages[language].meta.description);
    const anchor = scrollAnchor.current;
    if (anchor) {
      const section = document.getElementById(anchor.id);
      if (section) window.scrollBy({ top: section.getBoundingClientRect().top - anchor.top, behavior: 'instant' });
      scrollAnchor.current = null;
    }
  }, [language]);

  useEffect(() => {
    try { localStorage.setItem(languageStorageKey, language); } catch { /* Private/storage-restricted mode remains usable. */ }
  }, [language]);

  return { language, changeLanguage, c: languages[language], t: (key, values) => translate(language, key, values) };
}
