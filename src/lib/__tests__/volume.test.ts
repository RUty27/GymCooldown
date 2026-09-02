import { describe, expect, it } from 'vitest';
import { EXERCISES_BY_ID } from '../../data/exercises';
import type { Session } from '../../types';
import {
  exerciseTonnage,
  sessionVolumeByMuscle,
  setsInWindow,
  volumeInWindow,
} from '../volume';

const lookup = (id: string) => EXERCISES_BY_ID[id];

const session = (id: string, date: string, exercises: Session['exercises']): Session => ({
  id,
  date,
  exercises,
});

describe('exerciseTonnage', () => {
  it('sums reps x weight across sets', () => {
    expect(exerciseTonnage([{ reps: 10, weight: 60 }, { reps: 8, weight: 70 }])).toBe(1160);
  });

  it('is zero for no sets', () => {
    expect(exerciseTonnage([])).toBe(0);
  });
});

describe('sessionVolumeByMuscle', () => {
  it('gives full credit to primary and half to secondary muscles', () => {
    const s = session('a', '2026-01-01T10:00:00Z', [
      { exerciseId: 'bench-press', sets: [{ reps: 10, weight: 100 }] },
    ]);
    const v = sessionVolumeByMuscle(s, lookup);
    expect(v.chest).toBe(1000);
    expect(v.triceps).toBe(500);
    expect(v['front-delts']).toBe(500);
  });

  it('accumulates when two exercises hit the same muscle', () => {
    const s = session('a', '2026-01-01T10:00:00Z', [
      { exerciseId: 'bench-press', sets: [{ reps: 10, weight: 100 }] },
      { exerciseId: 'cable-fly', sets: [{ reps: 10, weight: 20 }] },
    ]);
    expect(sessionVolumeByMuscle(s, lookup).chest).toBe(1200);
  });

  it('counts bodyweight reps so unweighted work is not zero', () => {
    const s = session('a', '2026-01-01T10:00:00Z', [
      { exerciseId: 'push-up', sets: [{ reps: 30, weight: 0 }] },
    ]);
    const v = sessionVolumeByMuscle(s, lookup);
    expect(v.chest).toBe(30);
    expect(v.triceps).toBe(15);
  });

  it('ignores unknown exercise ids rather than throwing', () => {
    const s = session('a', '2026-01-01T10:00:00Z', [
      { exerciseId: 'not-a-real-lift', sets: [{ reps: 10, weight: 100 }] },
    ]);
    expect(sessionVolumeByMuscle(s, lookup)).toEqual({});
  });

  it('returns nothing for a session with no sets logged', () => {
    const s = session('a', '2026-01-01T10:00:00Z', [{ exerciseId: 'bench-press', sets: [] }]);
    expect(sessionVolumeByMuscle(s, lookup)).toEqual({});
  });
});

describe('volumeInWindow', () => {
  const now = Date.parse('2026-01-10T12:00:00Z');

  it('includes sessions inside the window and excludes older ones', () => {
    const sessions = [
      session('recent', '2026-01-09T12:00:00Z', [
        { exerciseId: 'back-squat', sets: [{ reps: 5, weight: 100 }] },
      ]),
      session('old', '2025-12-01T12:00:00Z', [
        { exerciseId: 'back-squat', sets: [{ reps: 5, weight: 100 }] },
      ]),
    ];
    expect(volumeInWindow(sessions, lookup, 7, now).quads).toBe(500);
  });

  it('ignores sessions dated in the future and unparseable dates', () => {
    const sessions = [
      session('future', '2026-02-01T12:00:00Z', [
        { exerciseId: 'back-squat', sets: [{ reps: 5, weight: 100 }] },
      ]),
      session('bad', 'not-a-date', [
        { exerciseId: 'back-squat', sets: [{ reps: 5, weight: 100 }] },
      ]),
    ];
    expect(volumeInWindow(sessions, lookup, 7, now)).toEqual({});
  });

  it('returns an empty map when there is no history', () => {
    expect(volumeInWindow([], lookup, 7, now)).toEqual({});
  });
});

describe('setsInWindow', () => {
  const now = Date.parse('2026-01-10T12:00:00Z');

  it('counts sets from both primary and secondary activation', () => {
    const sessions = [
      session('a', '2026-01-09T12:00:00Z', [
        { exerciseId: 'bench-press', sets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 100 }] },
        { exerciseId: 'tricep-pushdown', sets: [{ reps: 12, weight: 30 }] },
      ]),
    ];
    // 2 sets of bench (secondary triceps) + 1 pushdown (primary triceps)
    expect(setsInWindow(sessions, lookup, 'triceps', 7, now)).toBe(3);
    expect(setsInWindow(sessions, lookup, 'chest', 7, now)).toBe(2);
    expect(setsInWindow(sessions, lookup, 'calves', 7, now)).toBe(0);
  });
});
