import type { AppData } from '../types';
import { sanitizeLink } from './gymLinks';

const KEY = 'gymcooldown:data:v1';

export const emptyData = (): AppData => ({
  version: 2,
  sessions: [],
  settings: { unit: 'kg', theme: 'system' },
  customExercises: [],
});

/** Accept anything shaped like AppData; fall back to empty on corruption. */
export function parseData(raw: string | null): AppData {
  if (!raw) return emptyData();
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sessions)) {
      return emptyData();
    }
    // v1 had no `theme`; migrating it forward defaults to following the OS.
    const theme = parsed.settings?.theme;
    return {
      version: 2,
      sessions: parsed.sessions,
      settings: {
        unit: parsed.settings?.unit === 'lb' ? 'lb' : 'kg',
        theme: theme === 'light' || theme === 'dark' ? theme : 'system',
        ...(sanitizeLink(parsed.settings?.bookUrl) && { bookUrl: sanitizeLink(parsed.settings?.bookUrl) }),
        ...(sanitizeLink(parsed.settings?.doorUrl) && { doorUrl: sanitizeLink(parsed.settings?.doorUrl) }),
      },
      customExercises: Array.isArray(parsed.customExercises) ? parsed.customExercises : [],
    };
  } catch {
    return emptyData();
  }
}

export function loadData(): AppData {
  try {
    return parseData(localStorage.getItem(KEY));
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable (private mode, quota). Losing a write is
    // preferable to crashing mid-workout.
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
