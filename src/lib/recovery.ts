import type { Exercise, MuscleGroup, Session } from '../types';
import { sessionVolumeByMuscle } from './volume';

/**
 * Rest-time recommendations.
 *
 * These are general training heuristics, not medical advice: bigger muscle
 * groups and heavier compound work take longer to recover, small isolation
 * muscles bounce back within a day. Sleep, nutrition, age and training age all
 * move these numbers, so treat the output as a nudge rather than a rule.
 * Every constant is exported so it can be tuned in one place.
 */
export const BASE_RECOVERY_HOURS: Record<MuscleGroup, number> = {
  // Large, heavily loaded groups
  quads: 72,
  hamstrings: 72,
  glutes: 72,
  'lower-back': 72,
  lats: 60,
  // Mid-size groups
  chest: 48,
  traps: 48,
  'front-delts': 48,
  'side-delts': 40,
  // Small / fast-recovering groups
  triceps: 36,
  biceps: 36,
  'rear-delts': 30,
  obliques: 30,
  calves: 24,
  abs: 24,
  forearms: 24,
};

/** A session at or above this per-muscle volume load counts as a hard session. */
export const HEAVY_VOLUME_THRESHOLD = 4000;
/** Below this, the muscle was barely touched (a couple of light assist sets). */
export const LIGHT_VOLUME_THRESHOLD = 800;

export const MIN_RECOVERY_HOURS = 12;
export const MAX_RECOVERY_HOURS = 96;

/** Nothing logged for this long means the muscle is being neglected. */
export const UNDERTRAINED_DAYS = 10;

export type MuscleState = 'recovering' | 'ready' | 'undertrained';

export interface MuscleStatus {
  muscle: MuscleGroup;
  /** Hours since the muscle was last trained; null if never. */
  hoursSinceLast: number | null;
  /** Recommended rest for the most recent session that hit this muscle. */
  hoursNeeded: number;
  /** 0 = just trained, 1 = fully recovered. Clamped to [0, 1]. */
  recoveryPct: number;
  state: MuscleState;
  /** Volume load in the last 7 days. */
  weeklyVolume: number;
  lastSessionId: string | null;
}

/**
 * Scale a muscle's base recovery time by how hard the session actually hit it.
 * Light work shortens the rest, heavy compound work extends it.
 */
export function recoveryHours(
  muscle: MuscleGroup,
  volumeForMuscle: number,
  hadCompound: boolean,
): number {
  const base = BASE_RECOVERY_HOURS[muscle];
  let factor: number;
  if (volumeForMuscle <= LIGHT_VOLUME_THRESHOLD) {
    // Ramp from 0.5x (nothing) up to 1.0x at the light threshold.
    factor = 0.5 + 0.5 * (volumeForMuscle / LIGHT_VOLUME_THRESHOLD);
  } else if (volumeForMuscle >= HEAVY_VOLUME_THRESHOLD) {
    factor = 1.3;
  } else {
    const span = HEAVY_VOLUME_THRESHOLD - LIGHT_VOLUME_THRESHOLD;
    factor = 1 + 0.3 * ((volumeForMuscle - LIGHT_VOLUME_THRESHOLD) / span);
  }
  if (hadCompound) factor += 0.15;
  return clamp(Math.round(base * factor), MIN_RECOVERY_HOURS, MAX_RECOVERY_HOURS);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const HOUR = 60 * 60 * 1000;

interface Hit {
  time: number;
  volume: number;
  compound: boolean;
  sessionId: string;
}

/** Every past session that trained `muscle`, most recent first. */
function hitsFor(
  muscle: MuscleGroup,
  sessions: Session[],
  lookup: (id: string) => Exercise | undefined,
  now: number,
): Hit[] {
  const hits: Hit[] = [];
  for (const s of sessions) {
    const t = Date.parse(s.date);
    if (Number.isNaN(t) || t > now) continue;
    const vol = sessionVolumeByMuscle(s, lookup)[muscle];
    if (!vol) continue;
    const compound = s.exercises.some((le) => {
      const ex = lookup(le.exerciseId);
      return (
        !!ex && ex.compound && (ex.primary.includes(muscle) || ex.secondary.includes(muscle))
      );
    });
    hits.push({ time: t, volume: vol, compound, sessionId: s.id });
  }
  return hits.sort((a, b) => b.time - a.time);
}

export function muscleStatus(
  muscle: MuscleGroup,
  sessions: Session[],
  lookup: (id: string) => Exercise | undefined,
  now: number = Date.now(),
): MuscleStatus {
  const hits = hitsFor(muscle, sessions, lookup, now);
  const weekAgo = now - 7 * 24 * HOUR;
  const weeklyVolume = hits
    .filter((h) => h.time >= weekAgo)
    .reduce((sum, h) => sum + h.volume, 0);

  if (hits.length === 0) {
    return {
      muscle,
      hoursSinceLast: null,
      hoursNeeded: 0,
      recoveryPct: 1,
      state: 'undertrained',
      weeklyVolume: 0,
      lastSessionId: null,
    };
  }

  // Same-day sessions stack: sum everything logged since the most recent
  // calendar-adjacent block so training a muscle twice in a day reads as one
  // harder session rather than a fresh, lighter one.
  const last = hits[0];
  const sameDay = hits.filter((h) => last.time - h.time < 12 * HOUR);
  const volume = sameDay.reduce((sum, h) => sum + h.volume, 0);
  const compound = sameDay.some((h) => h.compound);

  const hoursSinceLast = (now - last.time) / HOUR;
  const hoursNeeded = recoveryHours(muscle, volume, compound);
  const recoveryPct = clamp(hoursSinceLast / hoursNeeded, 0, 1);

  const daysSince = hoursSinceLast / 24;
  const state: MuscleState =
    recoveryPct < 1 ? 'recovering' : daysSince >= UNDERTRAINED_DAYS ? 'undertrained' : 'ready';

  return {
    muscle,
    hoursSinceLast,
    hoursNeeded,
    recoveryPct,
    state,
    weeklyVolume,
    lastSessionId: last.sessionId,
  };
}

/** Human-readable "ready in 6h" / "ready in 2d 3h". */
export function formatRestRemaining(status: MuscleStatus): string {
  if (status.hoursSinceLast === null) return 'Not trained yet';
  const remaining = status.hoursNeeded - status.hoursSinceLast;
  if (remaining <= 0) return 'Ready to train';
  const hours = Math.ceil(remaining);
  if (hours < 24) return `Rest ~${hours}h more`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem === 0 ? `Rest ~${days}d more` : `Rest ~${days}d ${rem}h more`;
}

export function formatSinceLast(status: MuscleStatus): string {
  if (status.hoursSinceLast === null) return 'never';
  const hours = Math.floor(status.hoursSinceLast);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}
