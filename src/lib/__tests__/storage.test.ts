import { describe, expect, it } from 'vitest';
import { emptyData, parseData } from '../storage';

const v1Session = {
  id: 's1',
  date: '2026-09-01T10:00:00Z',
  exercises: [{ exerciseId: 'bench-press', sets: [{ reps: 10, weight: 60 }] }],
};

describe('parseData', () => {
  it('starts empty with no stored data', () => {
    expect(parseData(null)).toEqual(emptyData());
  });

  it('migrates a v1 payload without losing sessions', () => {
    const v1 = JSON.stringify({
      version: 1,
      sessions: [v1Session],
      settings: { unit: 'lb' },
      customExercises: [],
    });
    const out = parseData(v1);
    expect(out.version).toBe(2);
    expect(out.sessions).toHaveLength(1);
    expect(out.sessions[0].exercises[0].sets[0]).toEqual({ reps: 10, weight: 60 });
    expect(out.settings.unit).toBe('lb');
    // v1 knew nothing about themes — follow the OS rather than forcing one.
    expect(out.settings.theme).toBe('system');
  });

  it('keeps a stored theme preference', () => {
    for (const theme of ['light', 'dark', 'system'] as const) {
      const raw = JSON.stringify({ sessions: [], settings: { unit: 'kg', theme } });
      expect(parseData(raw).settings.theme).toBe(theme);
    }
  });

  it('falls back to system for an unknown theme value', () => {
    const raw = JSON.stringify({ sessions: [], settings: { unit: 'kg', theme: 'neon' } });
    expect(parseData(raw).settings.theme).toBe('system');
  });

  it('survives corrupt or non-conforming payloads', () => {
    expect(parseData('not json')).toEqual(emptyData());
    expect(parseData('{"sessions":"nope"}')).toEqual(emptyData());
  });

  it('keeps custom exercises across the migration', () => {
    const raw = JSON.stringify({
      version: 1,
      sessions: [],
      settings: { unit: 'kg' },
      customExercises: [{ id: 'custom-x', name: 'X', equipment: 'machine', primary: ['lats'], secondary: [], compound: false }],
    });
    expect(parseData(raw).customExercises).toHaveLength(1);
  });
});
