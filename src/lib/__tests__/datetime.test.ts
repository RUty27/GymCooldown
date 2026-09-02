import { describe, expect, it } from 'vitest';
import {
  calendarDaysAgo,
  clampToNow,
  describeSessionDate,
  fromLocalInputValue,
  shiftDays,
  toLocalInputValue,
} from '../datetime';

/** Build an ISO string for a local wall-clock time, so tests hold in any timezone. */
const localIso = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).toISOString();

describe('datetime-local round trip', () => {
  it('preserves the instant to the minute', () => {
    const iso = localIso(2026, 9, 1, 18, 30);
    const back = fromLocalInputValue(toLocalInputValue(iso));
    expect(back).not.toBeNull();
    expect(Math.abs(Date.parse(back!) - Date.parse(iso))).toBeLessThan(60_000);
  });

  it('formats as the YYYY-MM-DDTHH:mm the input expects', () => {
    expect(toLocalInputValue(localIso(2026, 9, 1, 8, 5))).toBe('2026-09-01T08:05');
  });

  it('returns null for empty or unparseable input', () => {
    expect(fromLocalInputValue('')).toBeNull();
    expect(fromLocalInputValue('not a date')).toBeNull();
  });

  it('yields an empty string for an invalid timestamp', () => {
    expect(toLocalInputValue('nonsense')).toBe('');
  });
});

describe('clampToNow', () => {
  const now = Date.parse('2026-09-02T12:00:00Z');

  it('pulls a future timestamp back to now', () => {
    const future = new Date(now + 5 * 60 * 60 * 1000).toISOString();
    expect(Date.parse(clampToNow(future, now))).toBe(now);
  });

  it('leaves a past timestamp untouched', () => {
    const past = new Date(now - 5 * 60 * 60 * 1000).toISOString();
    expect(Date.parse(clampToNow(past, now))).toBe(now - 5 * 60 * 60 * 1000);
  });

  it('falls back to now for an unparseable timestamp', () => {
    expect(Date.parse(clampToNow('rubbish', now))).toBe(now);
  });
});

describe('shiftDays', () => {
  it('keeps the same clock time a day earlier', () => {
    const iso = localIso(2026, 9, 2, 19, 30);
    const back = shiftDays(iso, -1);
    const d = new Date(back);
    expect(d.getHours()).toBe(19);
    expect(d.getMinutes()).toBe(30);
    expect(calendarDaysAgo(back, Date.parse(iso))).toBe(1);
  });
});

describe('describeSessionDate', () => {
  const now = Date.parse(localIso(2026, 9, 2, 12, 0));

  it('names today and yesterday by calendar day, not elapsed hours', () => {
    expect(describeSessionDate(localIso(2026, 9, 2, 9, 15), now)).toBe('Today, 09:15');
    // 23:30 yesterday is well under 24h before noon today, but is still "Yesterday"
    expect(describeSessionDate(localIso(2026, 9, 1, 23, 30), now)).toBe('Yesterday, 23:30');
  });

  it('falls back to a dated label further back', () => {
    const out = describeSessionDate(localIso(2026, 8, 28, 18, 0), now);
    expect(out).toMatch(/18:00$/);
    expect(out).not.toMatch(/Today|Yesterday/);
  });
});
