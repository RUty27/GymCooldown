import { useEffect, useState } from 'react';
import { applyTheme, resolveTheme } from '../lib/theme';
import type { ThemePreference } from '../types';

/** Resolves the preference, keeps <html class="dark"> in sync, follows the OS when 'system'. */
export function useResolvedTheme(preference: ThemePreference): 'light' | 'dark' {
  const [resolved, setResolved] = useState(() => resolveTheme(preference));

  useEffect(() => {
    const update = () => {
      const next = resolveTheme(preference);
      setResolved(next);
      applyTheme(next);
    };
    update();
    if (preference !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [preference]);

  return resolved;
}
