import { describe, expect, it } from 'vitest';
import { sanitizeLink } from '../gymLinks';
import { parseData } from '../storage';

describe('sanitizeLink', () => {
  it('accepts web and app links', () => {
    expect(sanitizeLink(' https://arkkies.com/x ')).toBe('https://arkkies.com/x');
    expect(sanitizeLink('arkkies://door')).toBe('arkkies://door');
  });
  it('rejects empty, schemeless and script links', () => {
    for (const bad of ['', '  ', 'arkkies.com', 'javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', 42])
      expect(sanitizeLink(bad)).toBeUndefined();
  });
  it('is applied when loading stored settings', () => {
    const out = parseData(
      JSON.stringify({ sessions: [], settings: { unit: 'kg', bookUrl: 'javascript:x', doorUrl: 'https://a.b' } }),
    );
    expect(out.settings.bookUrl).toBeUndefined();
    expect(out.settings.doorUrl).toBe('https://a.b');
  });
});
