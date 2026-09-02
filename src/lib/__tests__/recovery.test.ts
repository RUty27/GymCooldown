import { describe, expect, it } from 'vitest';
import { EXERCISES_BY_ID } from '../../data/exercises';
import type { Session } from '../../types';
import {
  BASE_RECOVERY_HOURS,
  HEAVY_VOLUME_THRESHOLD,
  MAX_RECOVERY_HOURS,
  MIN_RECOVERY_HOURS,
  formatRestRemaining,
  formatSinceLast,
  muscleStatus,
  recoveryHours,
} from '../recovery';

const lookup = (id: string) => EXERCISES_BY_ID[id];
const NOW = Date.parse('2026-01-10T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW - h * 3600_000).toISOString();

const session = (id: string, date: string, exercises: Session['exercises']): Session => ({
  id,
  date,
  exercises,
});

describe('recoveryHours', () => {
  it('scales up for heavy volume and down for light volume', () => {
    const light = recoveryHours('chest', 200, false);
    const moderate = recoveryHours('chest', 2000, false);
    const heavy = recoveryHours('chest', HEAVY_VOLUME_THRESHOLD * 2, false);
    expect(light).toBeLessThan(moderate);
    expect(moderate).toBeLessThan(heavy);
    expect(heavy).toBeGreaterThan(BASE_RECOVERY_HOURS.chest);
  });

  it('adds time for compound work at the same volume', () => {
    expect(recoveryHours('chest', 2000, true)).toBeGreaterThan(recoveryHours('chest', 2000, false));
  });

  it('gives small muscles less rest than large ones for equal work', () => {
    expect(recoveryHours('biceps', 2000, false)).toBeLessThan(recoveryHours('quads', 2000, false));
  });

  it('clamps to the allowed range at both extremes', () => {
    expect(recoveryHours('abs', 0, false)).toBeGreaterThanOrEqual(MIN_RECOVERY_HOURS);
    expect(recoveryHours('quads', 1e9, true)).toBeLessThanOrEqual(MAX_RECOVERY_HOURS);
  });
});

describe('muscleStatus', () => {
  it('reports undertrained with no history at all', () => {
    const s = muscleStatus('chest', [], lookup, NOW);
    expect(s.state).toBe('undertrained');
    expect(s.hoursSinceLast).toBeNull();
    expect(s.recoveryPct).toBe(1);
    expect(s.weeklyVolume).toBe(0);
  });

  it('is recovering right after a hard session', () => {
    const sessions = [
      session('a', hoursAgo(2), [
        { exerciseId: 'bench-press', sets: [{ reps: 8, weight: 100 }, { reps: 8, weight: 100 }] },
      ]),
    ];
    const s = muscleStatus('chest', sessions, lookup, NOW);
    expect(s.state).toBe('recovering');
    expect(s.recoveryPct).toBeLessThan(1);
    expect(s.hoursSinceLast).toBeCloseTo(2, 5);
  });

  it('is ready once enough time has passed', () => {
    const sessions = [
      session('a', hoursAgo(96), [
        { exerciseId: 'bench-press', sets: [{ reps: 8, weight: 100 }] },
      ]),
    ];
    const s = muscleStatus('chest', sessions, lookup, NOW);
    expect(s.state).toBe('ready');
    expect(s.recoveryPct).toBe(1);
  });

  it('flags a long-neglected muscle as undertrained rather than ready', () => {
    const sessions = [
      session('a', hoursAgo(24 * 20), [
        { exerciseId: 'bench-press', sets: [{ reps: 8, weight: 100 }] },
      ]),
    ];
    expect(muscleStatus('chest', sessions, lookup, NOW).state).toBe('undertrained');
  });

  it('stacks two sessions on the same day into one harder session', () => {
    const single = [
      session('a', hoursAgo(3), [
        { exerciseId: 'bench-press', sets: [{ reps: 8, weight: 100 }] },
      ]),
    ];
    const doubled = [
      ...single,
      session('b', hoursAgo(9), [
        { exerciseId: 'bench-press', sets: [{ reps: 8, weight: 100 }] },
      ]),
    ];
    expect(muscleStatus('chest', doubled, lookup, NOW).hoursNeeded).toBeGreaterThan(
      muscleStatus('chest', single, lookup, NOW).hoursNeeded,
    );
  });

  it('tracks a muscle reached only through secondary activation', () => {
    const sessions = [
      session('a', hoursAgo(2), [
        { exerciseId: 'bench-press', sets: [{ reps: 10, weight: 100 }] },
      ]),
    ];
    const s = muscleStatus('triceps', sessions, lookup, NOW);
    expect(s.hoursSinceLast).not.toBeNull();
    expect(s.weeklyVolume).toBe(500);
    expect(s.state).toBe('recovering');
  });

  it('uses the most recent session even when history is out of order', () => {
    const sessions = [
      session('old', hoursAgo(200), [
        { exerciseId: 'back-squat', sets: [{ reps: 5, weight: 100 }] },
      ]),
      session('new', hoursAgo(5), [
        { exerciseId: 'back-squat', sets: [{ reps: 5, weight: 100 }] },
      ]),
    ];
    const s = muscleStatus('quads', sessions, lookup, NOW);
    expect(s.lastSessionId).toBe('new');
    expect(s.hoursSinceLast).toBeCloseTo(5, 5);
  });

  it('counts only the last 7 days toward weekly volume', () => {
    const sessions = [
      session('recent', hoursAgo(24), [
        { exerciseId: 'back-squat', sets: [{ reps: 5, weight: 100 }] },
      ]),
      session('old', hoursAgo(24 * 30), [
        { exerciseId: 'back-squat', sets: [{ reps: 5, weight: 100 }] },
      ]),
    ];
    expect(muscleStatus('quads', sessions, lookup, NOW).weeklyVolume).toBe(500);
  });
});

describe('formatting', () => {
  it('says ready when recovery is complete', () => {
    const sessions = [
      session('a', hoursAgo(96), [
        { exerciseId: 'bench-press', sets: [{ reps: 8, weight: 100 }] },
      ]),
    ];
    expect(formatRestRemaining(muscleStatus('chest', sessions, lookup, NOW))).toBe(
      'Ready to train',
    );
  });

  it('reports remaining rest in hours and days', () => {
    const sessions = [
      session('a', hoursAgo(1), [
        { exerciseId: 'back-squat', sets: [{ reps: 5, weight: 140 }, { reps: 5, weight: 140 }] },
      ]),
    ];
    expect(formatRestRemaining(muscleStatus('quads', sessions, lookup, NOW))).toMatch(/Rest ~\d+d/);
  });

  it('describes how long ago a muscle was trained', () => {
    const sessions = [
      session('a', hoursAgo(30), [
        { exerciseId: 'bench-press', sets: [{ reps: 8, weight: 100 }] },
      ]),
    ];
    expect(formatSinceLast(muscleStatus('chest', sessions, lookup, NOW))).toBe('1 day ago');
    expect(formatSinceLast(muscleStatus('calves', [], lookup, NOW))).toBe('never');
  });
});
