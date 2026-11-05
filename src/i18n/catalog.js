import es from './es.json';
import en from './en.json';

export const languages = { es, en };
export const languageStorageKey = 'felinaria-language';

export function formatMessage(message, values = {}) {
  return message.replace(/\{(\w+)\}/g, (token, name) => String(values[name] ?? token));
}

export function translate(language, key, values) {
  const find = (catalog) => key.split('.').reduce((value, part) => value?.[part], catalog);
  const message = find(languages[language]) ?? find(es);
  if (typeof message !== 'string') throw new Error(`Missing translation: ${key}`);
  return formatMessage(message, values);
}
