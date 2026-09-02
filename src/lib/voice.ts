import type { Exercise, SetEntry, Unit } from '../types';

/**
 * Turns a spoken sentence into logged sets.
 *
 * Handles the way people actually talk in a gym:
 *   "bench press 3 sets of 10 at 60 kilos"
 *   "squat 5 by 100, then leg press 3 of 12 at 80"
 *   "lat pulldown 10 reps 50"
 *   "20 push ups bodyweight"
 *
 * Everything here is pure so it can be unit-tested without a microphone.
 */

export interface ParsedEntry {
  exerciseId: string;
  exerciseName: string;
  sets: SetEntry[];
  /** The slice of the transcript this came from, shown back for confirmation. */
  heard: string;
}

export interface ParseResult {
  entries: ParsedEntry[];
  /** Text that mentioned no exercise we recognise. */
  unmatched: string[];
}

const LB_PER_KG = 2.20462;

/** Common gym shorthand that will never match an exercise name directly. */
const ALIASES: Record<string, string> = {
  bench: 'bench-press',
  'flat bench': 'bench-press',
  'chest press': 'chest-press-machine',
  squat: 'back-squat',
  squats: 'back-squat',
  deadlift: 'deadlift',
  deadlifts: 'deadlift',
  rdl: 'romanian-deadlift',
  ohp: 'ohp',
  'shoulder press': 'db-shoulder-press',
  'military press': 'ohp',
  pulldown: 'lat-pulldown',
  pulldowns: 'lat-pulldown',
  pullup: 'pull-up',
  pullups: 'pull-up',
  'pull ups': 'pull-up',
  chinup: 'chin-up',
  chinups: 'chin-up',
  'push ups': 'push-up',
  pushup: 'push-up',
  pushups: 'push-up',
  curls: 'barbell-curl',
  curl: 'barbell-curl',
  'bicep curl': 'db-curl',
  'bicep curls': 'db-curl',
  'tricep pushdowns': 'tricep-pushdown',
  'lateral raises': 'lateral-raise',
  'side raises': 'lateral-raise',
  'leg curls': 'leg-curl',
  'leg extensions': 'leg-extension',
  'calf raises': 'standing-calf-raise',
  'calf raise': 'standing-calf-raise',
  'hip thrusts': 'hip-thrust',
  'face pulls': 'face-pull',
  dip: 'dips',
  rows: 'barbell-row',
  row: 'barbell-row',
  plank: 'plank',
  crunches: 'crunch',
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
};
const TENS_WORDS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/** "sixty five kilos" -> "65 kilos", so the numeric patterns below can do the work. */
export function wordsToNumbers(text: string): string {
  const tokens = text.split(/\s+/);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t in TENS_WORDS) {
      const next = tokens[i + 1];
      if (next && next in NUMBER_WORDS && NUMBER_WORDS[next] >= 1 && NUMBER_WORDS[next] <= 9) {
        out.push(String(TENS_WORDS[t] + NUMBER_WORDS[next]));
        i++;
        continue;
      }
      out.push(String(TENS_WORDS[t]));
      continue;
    }
    if (t in NUMBER_WORDS) {
      out.push(String(NUMBER_WORDS[t]));
      continue;
    }
    out.push(t);
  }
  return out.join(' ');
}

export function normalize(text: string): string {
  return wordsToNumbers(
    text
      .toLowerCase()
      .replace(/[^\w\s.@]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

/** Search phrases for an exercise, longest (most specific) first. */
function phrasesFor(ex: Exercise): string[] {
  const full = ex.name.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const phrases = new Set<string>([full]);
  // Drop the leading equipment word so "dumbbell bench press" also matches "bench press".
  const words = full.split(' ');
  if (words.length > 2) {
    const [first] = words;
    if (['barbell', 'dumbbell', 'cable', 'seated', 'standing', 'machine', 'lying', 'one'].includes(first)) {
      phrases.add(words.slice(1).join(' '));
    }
  }
  return [...phrases].filter((p) => p.length >= 3);
}

interface Match {
  start: number;
  end: number;
  exercise: Exercise;
  length: number;
}

/** Locate every exercise mentioned, keeping the most specific non-overlapping matches. */
function findExercises(text: string, exercises: Exercise[]): Match[] {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const candidates: Match[] = [];

  const record = (phrase: string, ex: Exercise) => {
    let from = 0;
    for (;;) {
      const idx = text.indexOf(phrase, from);
      if (idx === -1) break;
      // Only whole-word hits.
      const before = idx === 0 || text[idx - 1] === ' ';
      const afterIdx = idx + phrase.length;
      const after = afterIdx === text.length || text[afterIdx] === ' ';
      if (before && after) {
        candidates.push({ start: idx, end: afterIdx, exercise: ex, length: phrase.length });
      }
      from = idx + 1;
    }
  };

  for (const ex of exercises) for (const p of phrasesFor(ex)) record(p, ex);
  for (const [alias, id] of Object.entries(ALIASES)) {
    const ex = byId.get(id);
    if (ex) record(alias, ex);
  }

  // Prefer longer (more specific) phrases, then earlier ones; drop overlaps.
  candidates.sort((a, b) => b.length - a.length || a.start - b.start);
  const taken: Match[] = [];
  for (const c of candidates) {
    if (taken.some((t) => c.start < t.end && t.start < c.end)) continue;
    taken.push(c);
  }
  return taken.sort((a, b) => a.start - b.start);
}

interface Numbers {
  sets: number;
  reps: number;
  weightKg: number;
}

/** Pull sets / reps / weight out of one clause. */
export function parseNumbers(clause: string, defaultUnit: Unit): Numbers | null {
  let sets = 0;
  let reps = 0;
  let weightKg = -1;

  // Weight first, so its number is not mistaken for reps.
  let rest = clause;
  const weightMatch =
    clause.match(/(?:at|@|with|using)\s*(\d+(?:\.\d+)?)\s*(kgs?|kilos?|kilograms?|lbs?|pounds?)?/) ??
    clause.match(/(\d+(?:\.\d+)?)\s*(kgs?|kilos?|kilograms?|lbs?|pounds?)/);
  if (weightMatch) {
    const value = parseFloat(weightMatch[1]);
    const unit = weightMatch[2];
    const isLb = unit ? /lb|pound/.test(unit) : defaultUnit === 'lb';
    weightKg = isLb ? value / LB_PER_KG : value;
    rest = clause.replace(weightMatch[0], ' ');
  }
  if (/\b(body ?weight|bw|no weight)\b/.test(clause)) weightKg = 0;

  // "3 sets of 10" / "3 x 10" / "3 by 10" / "3 of 12" — people drop "sets" constantly.
  const setsReps = rest.match(/(\d+)\s*(?:sets?|x|by|of)\s*(?:of\s*)?(\d+)/);
  if (setsReps) {
    sets = parseInt(setsReps[1], 10);
    reps = parseInt(setsReps[2], 10);
  } else {
    const repsOnly = rest.match(/(\d+)\s*reps?/);
    const setsOnly = rest.match(/(\d+)\s*sets?/);
    if (repsOnly) reps = parseInt(repsOnly[1], 10);
    if (setsOnly) sets = parseInt(setsOnly[1], 10);
    if (!reps && !sets) {
      const bare = rest.match(/\b(\d+)\b/);
      if (bare) reps = parseInt(bare[1], 10);
    }
  }

  if (!reps && !sets) return null;
  if (!reps) reps = 1;
  if (!sets) sets = 1;

  // Guard against a misheard "300 sets".
  sets = Math.min(Math.max(sets, 1), 20);
  reps = Math.min(Math.max(reps, 1), 200);

  return { sets, reps, weightKg: weightKg < 0 ? 0 : weightKg };
}

export function parseWorkoutSpeech(
  transcript: string,
  exercises: Exercise[],
  defaultUnit: Unit = 'kg',
): ParseResult {
  const text = normalize(transcript);
  if (!text) return { entries: [], unmatched: [] };

  const matches = findExercises(text, exercises);
  if (matches.length === 0) {
    return { entries: [], unmatched: [transcript.trim()] };
  }

  const entries: ParsedEntry[] = [];
  const unmatched: string[] = [];

  matches.forEach((m, i) => {
    const clauseEnd = i + 1 < matches.length ? matches[i + 1].start : text.length;
    const clause = text.slice(m.start, clauseEnd).trim();
    const numbers = parseNumbers(text.slice(m.end, clauseEnd), defaultUnit);
    if (!numbers) {
      unmatched.push(clause);
      return;
    }
    const sets: SetEntry[] = Array.from({ length: numbers.sets }, () => ({
      reps: numbers.reps,
      weight: Math.round(numbers.weightKg * 100) / 100,
    }));
    entries.push({
      exerciseId: m.exercise.id,
      exerciseName: m.exercise.name,
      sets,
      heard: clause,
    });
  });

  return { entries, unmatched };
}
