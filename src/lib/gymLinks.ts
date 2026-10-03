export const DEFAULT_BOOK_URL = 'https://arkkies.com';

/**
 * Accept web links and app deep links (e.g. a gym's own scheme), but never
 * script-bearing ones — the value ends up in an anchor href.
 */
export function sanitizeLink(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1].toLowerCase();
  if (!scheme || ['javascript', 'data', 'vbscript', 'file', 'blob'].includes(scheme)) return undefined;
  return value;
}
