import type { Exercise } from '../types';

/**
 * Recommended rest *between sets*, distinct from the multi-day recovery in
 * recovery.ts. Heavy low-rep compound work needs full ATP/CP resynthesis
 * (~3 min); higher-rep isolation work needs far less.
 */
export interface RestRecommendation {
  seconds: number;
  label: string;
  reason: string;
}

export function restBetweenSets(exercise: Exercise, typicalReps: number): RestRecommendation {
  let seconds: number;
  let reason: string;

  if (exercise.compound) {
    if (typicalReps <= 5) {
      seconds = 180;
      reason = 'Heavy compound, low reps — full recovery between sets.';
    } else if (typicalReps <= 12) {
      seconds = 120;
      reason = 'Compound lift in the hypertrophy range.';
    } else {
      seconds = 90;
      reason = 'High-rep compound work.';
    }
  } else {
    if (typicalReps <= 8) {
      seconds = 90;
      reason = 'Heavier isolation work.';
    } else if (typicalReps <= 15) {
      seconds = 60;
      reason = 'Isolation lift — short rest keeps tension high.';
    } else {
      seconds = 45;
      reason = 'High-rep isolation / pump work.';
    }
  }

  return { seconds, label: formatSeconds(seconds), reason };
}

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m}m ${s}s`;
}

/** Median-ish rep count for a logged exercise, used to pick a rest bracket. */
export function typicalReps(sets: { reps: number }[]): number {
  if (sets.length === 0) return 10;
  const sorted = sets.map((s) => s.reps).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
