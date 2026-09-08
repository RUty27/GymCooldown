import type { MuscleStatus } from './recovery';

/**
 * Heatmap colours for the Organic theme, validated with the data-viz palette
 * validator against both grounds (light #f5ead8, dark #24211c).
 *
 * Recovery is a *state*, so it uses status colours in three buckets plus a
 * neutral for "no recent work". Colour is never the only channel: the legend,
 * the muscle cards and the detail sheet all spell the state out in words.
 *
 * Two values deviate from the design handoff, because its own proposal failed
 * validation and it asked for the check to be re-run:
 *
 *  - Dark `almost` is accent-300 rather than accent-400. Against dark `ready`
 *    (sage-500) the handoff's value measured deuteranopia/protanopia dE 5.5,
 *    under the dE 8 floor, so the two states were indistinguishable. This is
 *    the handoff's own prescribed remedy and measures dE 15.4.
 *  - The light volume ramp is anchored at sage-500 instead of sage-200, and
 *    VOLUME_EMPTY recedes toward the ground. The handoff's lightest step sat at
 *    1.02:1 against the cream ground and only dE 4.4 from "empty", so low
 *    volume was invisible. Anchored this way every ordinal check passes and
 *    empty-vs-lowest measures dE 25.6.
 */

export const RECOVERY_COLORS = {
  recovering: '#b2622d', // accent-600
  almost: '#f6a06b', // accent-400
  ready: '#728157', // accent-2-600
  none: '#c0b6a5', // neutral-400
} as const;

export const RECOVERY_COLORS_DARK = {
  recovering: '#b2622d',
  almost: '#ffc6a5', // accent-300 — see note above
  ready: '#8fa073', // accent-2-500, lifts off the dark ground
  none: '#645c50', // neutral-700
} as const;

/** Volume is a magnitude: one hue, low to high, stepped for each ground. */
export const VOLUME_RAMP_LIGHT = ['#8fa073', '#728157', '#56633f', '#3d472b', '#272e1b'] as const;
export const VOLUME_RAMP_DARK = ['#e1eecc', '#ccdbb2', '#aebf92', '#8fa073', '#728157'] as const;
export const VOLUME_EMPTY_LIGHT = '#eee7db'; // neutral-200, recedes toward the ground
export const VOLUME_EMPTY_DARK = '#322d26'; // dark surface

export type Theme = 'light' | 'dark';
export type HeatmapMode = 'recovery' | 'volume';

export const recoveryColors = (theme: Theme) =>
  theme === 'dark' ? RECOVERY_COLORS_DARK : RECOVERY_COLORS;
export const volumeRamp = (theme: Theme) =>
  theme === 'dark' ? VOLUME_RAMP_DARK : VOLUME_RAMP_LIGHT;
export const volumeEmpty = (theme: Theme) =>
  theme === 'dark' ? VOLUME_EMPTY_DARK : VOLUME_EMPTY_LIGHT;

export interface LegendEntry {
  color: string;
  label: string;
}

export const recoveryLegend = (theme: Theme): LegendEntry[] => {
  const c = recoveryColors(theme);
  return [
    { color: c.recovering, label: 'Resting' },
    { color: c.almost, label: 'Almost' },
    { color: c.ready, label: 'Ready' },
    { color: c.none, label: 'No recent work' },
  ];
};

export const volumeLegend = (theme: Theme): LegendEntry[] => {
  const ramp = volumeRamp(theme);
  return [
    { color: volumeEmpty(theme), label: 'None' },
    { color: ramp[0], label: 'Low' },
    { color: ramp[2], label: 'Moderate' },
    { color: ramp[4], label: 'High' },
  ];
};

export function recoveryColor(status: MuscleStatus, theme: Theme = 'light'): string {
  const c = recoveryColors(theme);
  if (status.hoursSinceLast === null || status.state === 'undertrained') return c.none;
  if (status.recoveryPct >= 1) return c.ready;
  if (status.recoveryPct >= 0.5) return c.almost;
  return c.recovering;
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

export function volumeColor(
  weeklyVolume: number,
  scaleMax: number,
  theme: Theme = 'light',
): string {
  if (weeklyVolume <= 0) return volumeEmpty(theme);
  const ramp = volumeRamp(theme);
  const max = Math.max(scaleMax, VOLUME_SCALE_FLOOR);
  const ratio = Math.min(weeklyVolume / max, 1);
  return ramp[Math.min(ramp.length - 1, Math.floor(ratio * ramp.length))];
}
