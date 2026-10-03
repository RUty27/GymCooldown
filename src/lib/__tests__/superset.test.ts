import { describe, expect, it } from 'vitest';
import { isLinkedToNext, linkWithNext, supersetLabels, unlinkFromNext } from '../superset';
import type { LoggedExercise } from '../../types';

const mk = (...ids: string[]): LoggedExercise[] => ids.map((exerciseId) => ({ exerciseId, sets: [] }));

describe('superset', () => {
  it('links two neighbours', () => {
    const l = linkWithNext(mk('a', 'b', 'c'), 0);
    expect(isLinkedToNext(l, 0)).toBe(true);
    expect(l[2].supersetId).toBeUndefined();
  });

  it('extends a pair into a tri-set', () => {
    const l = linkWithNext(linkWithNext(mk('a', 'b', 'c'), 0), 1);
    expect(new Set(l.map((e) => e.supersetId)).size).toBe(1);
    expect(l[2].supersetId).toBeDefined();
  });

  it('unlinking a pair clears both', () => {
    const l = unlinkFromNext(linkWithNext(mk('a', 'b'), 0), 0);
    expect(l.every((e) => !e.supersetId)).toBe(true);
  });

  it('splitting a tri-set leaves a pair and a single', () => {
    const tri = linkWithNext(linkWithNext(mk('a', 'b', 'c'), 0), 1);
    const l = unlinkFromNext(tri, 0);
    expect(l[0].supersetId).toBeUndefined();
    expect(isLinkedToNext(l, 1)).toBe(true);
  });

  it('labels in order of appearance', () => {
    const l = linkWithNext(linkWithNext(mk('a', 'b', 'c', 'd'), 0), 2);
    expect([...supersetLabels(l).values()]).toEqual(['A', 'B']);
  });
});
