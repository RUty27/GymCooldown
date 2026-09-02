/**
 * Helpers for picking and displaying a session's date.
 *
 * Sessions store a full ISO timestamp, and the recovery model works in hours,
 * so the time of day matters as much as the calendar day — "yesterday evening"
 * and "yesterday morning" are ~12 hours apart in how recovered you are.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export const MINUTE = 60 * 1000;
export const DAY = 24 * 60 * MINUTE;

/** ISO timestamp -> the `YYYY-MM-DDTHH:mm` an <input type="datetime-local"> wants, in local time. */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** The input's local `YYYY-MM-DDTHH:mm` back to an ISO timestamp. */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  // A date-time string with no zone designator is parsed as local time.
  const t = Date.parse(value);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

/**
 * A session dated in the future is silently skipped by the volume and recovery
 * calculations, so it would save and then vanish from the body map. Never let a
 * timestamp past `now` through.
 */
export function clampToNow(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return new Date(now).toISOString();
  return t > now ? new Date(now).toISOString() : new Date(t).toISOString();
}

/** Same clock time, `days` days earlier. */
export function shiftDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Whole calendar days between two instants, by local date (not by elapsed hours). */
export function calendarDaysAgo(iso: string, now: number = Date.now()): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const a = new Date(t);
  const b = new Date(now);
  const startA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const startB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((startB - startA) / DAY);
}

const timeOf = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "Today, 18:30" / "Yesterday, 09:15" / "Mon 1 Sep, 19:00". */
export function describeSessionDate(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'Unknown date';
  const d = new Date(t);
  const days = calendarDaysAgo(iso, now);
  if (days === 0) return `Today, ${timeOf(d)}`;
  if (days === 1) return `Yesterday, ${timeOf(d)}`;
  return `${d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })}, ${timeOf(d)}`;
}
