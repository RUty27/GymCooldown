import type { Unit } from '../types';

const LB_PER_KG = 2.20462;

/** Weights are stored in kg; these convert for display and input only. */
export function toDisplay(kg: number, unit: Unit): number {
  const value = unit === 'lb' ? kg * LB_PER_KG : kg;
  return Math.round(value * 10) / 10;
}

export function fromDisplay(value: number, unit: Unit): number {
  return unit === 'lb' ? value / LB_PER_KG : value;
}

export function formatWeight(kg: number, unit: Unit): string {
  if (kg === 0) return 'BW';
  const v = toDisplay(kg, unit);
  return `${Number.isInteger(v) ? v : v.toFixed(1)} ${unit}`;
}
