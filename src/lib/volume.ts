import type { Exercise, MuscleGroup, Session } from '../types';
import { MUSCLE_GROUPS } from '../types';

/** Muscles listed as `secondary` absorb roughly half the work of the primaries. */
export const SECONDARY_WEIGHT = 0.5;

export type MuscleVolume = Partial<Record<MuscleGroup, number>>;

export const emptyVolume = (): MuscleVolume => ({});

function addTo(target: MuscleVolume, muscle: MuscleGroup, amount: number): void {
  target[muscle] = (target[muscle] ?? 0) + amount;
}

/** Tonnage for one logged exercise: sum of reps x weight across its sets. */
export function exerciseTonnage(sets: { reps: number; weight: number }[]): number {
  return sets.reduce((total, s) => total + s.reps * s.weight, 0);
}

/**
 * Volume load per muscle for a single session.
 * Bodyweight work logged at weight 0 still counts, so reps alone contribute a
 * nominal load — otherwise a set of 30 push-ups would register as zero work.
 */
export function sessionVolumeByMuscle(
  session: Session,
  lookup: (id: string) => Exercise | undefined,
): MuscleVolume {
  const out: MuscleVolume = {};
  for (const logged of session.exercises) {
    const exercise = lookup(logged.exerciseId);
    if (!exercise) continue;
    const tonnage = exerciseTonnage(logged.sets);
    const reps = logged.sets.reduce((n, s) => n + s.reps, 0);
    // Treat unweighted reps as ~1 unit of load each so bodyweight work registers.
    const load = tonnage > 0 ? tonnage : reps;
    if (load <= 0) continue;
    for (const m of exercise.primary) addTo(out, m, load);
    for (const m of exercise.secondary) addTo(out, m, load * SECONDARY_WEIGHT);
  }
  return out;
}

export function mergeVolume(a: MuscleVolume, b: MuscleVolume): MuscleVolume {
  const out: MuscleVolume = { ...a };
  for (const m of MUSCLE_GROUPS) {
    if (b[m] !== undefined) out[m] = (out[m] ?? 0) + (b[m] as number);
  }
  return out;
}

/** Combined per-muscle volume over the last `days` days. */
export function volumeInWindow(
  sessions: Session[],
  lookup: (id: string) => Exercise | undefined,
  days: number,
  now: number = Date.now(),
): MuscleVolume {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  let out: MuscleVolume = {};
  for (const s of sessions) {
    const t = Date.parse(s.date);
    if (Number.isNaN(t) || t < cutoff || t > now) continue;
    out = mergeVolume(out, sessionVolumeByMuscle(s, lookup));
  }
  return out;
}

/** Number of distinct sets that touched a muscle in the window (primary or secondary). */
export function setsInWindow(
  sessions: Session[],
  lookup: (id: string) => Exercise | undefined,
  muscle: MuscleGroup,
  days: number,
  now: number = Date.now(),
): number {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const s of sessions) {
    const t = Date.parse(s.date);
    if (Number.isNaN(t) || t < cutoff || t > now) continue;
    for (const logged of s.exercises) {
      const ex = lookup(logged.exerciseId);
      if (!ex) continue;
      if (ex.primary.includes(muscle) || ex.secondary.includes(muscle)) {
        count += logged.sets.length;
      }
    }
  }
  return count;
}
