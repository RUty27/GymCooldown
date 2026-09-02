import type { MuscleStatus } from './recovery';

/**
 * Colours validated with the data-viz palette validator against this app's
 * dark panel surface (#131a23).
 *
 * Recovery is a *state*, so it uses the reserved status palette in three
 * buckets plus a neutral for "no recent work" (CVD dE 11.3, normal-vision 27.6,
 * all >= 3:1 contrast). Status colour never carries meaning alone here - the
 * legend and the per-muscle detail sheet always spell the state out in words.
 *
 * Volume is a magnitude, so it uses a single-hue blue sequential ramp stepped
 * for a dark surface: near-zero recedes toward the panel, high volume comes
 * forward (monotone lightness, all steps clear the surface).
 */

export const RECOVERY_COLORS = {
  recovering: '#d03b3b',
  almost: '#fab219',
  ready: '#0ca30c',
  none: '#4b5563',
} as const;

export const VOLUME_RAMP = ['#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4'] as const;
export const VOLUME_EMPTY = '#1b242f';

export type HeatmapMode = 'recovery' | 'volume';

export interface LegendEntry {
  color: string;
  label: string;
}

export const RECOVERY_LEGEND: LegendEntry[] = [
  { color: RECOVERY_COLORS.recovering, label: 'Recovering' },
  { color: RECOVERY_COLORS.almost, label: 'Almost ready' },
  { color: RECOVERY_COLORS.ready, label: 'Ready' },
  { color: RECOVERY_COLORS.none, label: 'No recent work' },
];

export const VOLUME_LEGEND: LegendEntry[] = [
  { color: VOLUME_EMPTY, label: 'None' },
  { color: VOLUME_RAMP[0], label: 'Low' },
  { color: VOLUME_RAMP[2], label: 'Moderate' },
  { color: VOLUME_RAMP[4], label: 'High' },
];

export function recoveryColor(status: MuscleStatus): string {
  if (status.hoursSinceLast === null || status.state === 'undertrained') {
    return RECOVERY_COLORS.none;
  }
  if (status.recoveryPct >= 1) return RECOVERY_COLORS.ready;
  if (status.recoveryPct >= 0.5) return RECOVERY_COLORS.almost;
  return RECOVERY_COLORS.recovering;
}

/** Words for the same buckets, so colour is never the only channel. */
export function recoveryLabel(status: MuscleStatus): string {
  if (status.hoursSinceLast === null) return 'Never trained';
  if (status.state === 'undertrained') return 'No recent work';
  if (status.recoveryPct >= 1) return 'Ready';
  if (status.recoveryPct >= 0.5) return 'Almost ready';
  return 'Recovering';
}

/**
 * Map weekly volume onto the ramp. The scale floors at a sensible weekly load
 * so one logged set does not immediately paint a muscle as "high volume".
 */
export const VOLUME_SCALE_FLOOR = 6000;

export function volumeColor(weeklyVolume: number, scaleMax: number): string {
  if (weeklyVolume <= 0) return VOLUME_EMPTY;
  const max = Math.max(scaleMax, VOLUME_SCALE_FLOOR);
  const ratio = Math.min(weeklyVolume / max, 1);
  const index = Math.min(VOLUME_RAMP.length - 1, Math.floor(ratio * VOLUME_RAMP.length));
  return VOLUME_RAMP[index];
}
