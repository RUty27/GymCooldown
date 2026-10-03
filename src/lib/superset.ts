import type { LoggedExercise } from '../types';

const newId = () => `ss_${Math.random().toString(36).slice(2, 8)}`;

/** A superset needs at least two members; a lone leftover reverts to a plain exercise. */
function dropSingletons(list: LoggedExercise[]): LoggedExercise[] {
  const counts = new Map<string, number>();
  for (const e of list) if (e.supersetId) counts.set(e.supersetId, (counts.get(e.supersetId) ?? 0) + 1);
  return list.map((e) => {
    if (!e.supersetId || (counts.get(e.supersetId) ?? 0) > 1) return e;
    const { supersetId: _drop, ...rest } = e;
    return rest;
  });
}

export const isLinkedToNext = (list: LoggedExercise[], i: number): boolean =>
  !!list[i]?.supersetId && list[i].supersetId === list[i + 1]?.supersetId;

/** Join exercise `i` and the one after it into the same superset. */
export function linkWithNext(list: LoggedExercise[], i: number): LoggedExercise[] {
  const a = list[i];
  const b = list[i + 1];
  if (!a || !b || isLinkedToNext(list, i)) return list;
  const id = a.supersetId ?? newId();
  const absorbed = b.supersetId;
  return dropSingletons(
    list.map((e, j) =>
      j === i || j === i + 1 || (absorbed && e.supersetId === absorbed) ? { ...e, supersetId: id } : e,
    ),
  );
}

/** Break the superset between exercise `i` and the one after it. */
export function unlinkFromNext(list: LoggedExercise[], i: number): LoggedExercise[] {
  if (!isLinkedToNext(list, i)) return list;
  const id = list[i].supersetId;
  const tail = newId();
  return dropSingletons(list.map((e, j) => (j > i && e.supersetId === id ? { ...e, supersetId: tail } : e)));
}

export const normalizeSupersets = dropSingletons;

/** Letter label (A, B, …) for each superset, in order of appearance. */
export function supersetLabels(list: LoggedExercise[]): Map<string, string> {
  const labels = new Map<string, string>();
  for (const e of list) {
    if (e.supersetId && !labels.has(e.supersetId)) {
      labels.set(e.supersetId, String.fromCharCode(65 + (labels.size % 26)));
    }
  }
  return labels;
}
