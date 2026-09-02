import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../data/exercises';
import { parseNumbers, parseWorkoutSpeech, wordsToNumbers } from '../voice';

const parse = (t: string, unit: 'kg' | 'lb' = 'kg') =>
  parseWorkoutSpeech(t, EXERCISES, unit);

describe('wordsToNumbers', () => {
  it('converts plain and compound number words', () => {
    expect(wordsToNumbers('three sets of ten')).toBe('3 sets of 10');
    expect(wordsToNumbers('sixty five kilos')).toBe('65 kilos');
    expect(wordsToNumbers('twenty')).toBe('20');
  });

  it('leaves ordinary words alone', () => {
    expect(wordsToNumbers('bench press')).toBe('bench press');
  });
});

describe('parseNumbers', () => {
  it('reads sets and reps in the common phrasings', () => {
    expect(parseNumbers('3 sets of 10', 'kg')).toMatchObject({ sets: 3, reps: 10 });
    expect(parseNumbers('3 x 10', 'kg')).toMatchObject({ sets: 3, reps: 10 });
    expect(parseNumbers('5 by 5', 'kg')).toMatchObject({ sets: 5, reps: 5 });
    // people routinely drop the word "sets"
    expect(parseNumbers('3 of 12', 'kg')).toMatchObject({ sets: 3, reps: 12 });
    expect(parseNumbers('3 of 12 at 50', 'kg')).toMatchObject({ sets: 3, reps: 12, weightKg: 50 });
  });

  it('separates weight from reps', () => {
    expect(parseNumbers('3 sets of 10 at 60 kilos', 'kg')).toMatchObject({
      sets: 3, reps: 10, weightKg: 60,
    });
  });

  it('converts pounds to kilograms', () => {
    const n = parseNumbers('3 sets of 5 at 135 pounds', 'kg')!;
    expect(n.weightKg).toBeCloseTo(61.2, 1);
  });

  it('uses the display unit when none is spoken', () => {
    expect(parseNumbers('3 sets of 10 at 100', 'kg')!.weightKg).toBe(100);
    expect(parseNumbers('3 sets of 10 at 100', 'lb')!.weightKg).toBeCloseTo(45.36, 1);
  });

  it('treats bodyweight as zero load', () => {
    expect(parseNumbers('3 sets of 10 bodyweight', 'kg')).toMatchObject({ weightKg: 0 });
  });

  it('defaults a single set when only reps are given', () => {
    expect(parseNumbers('10 reps at 50', 'kg')).toMatchObject({ sets: 1, reps: 10, weightKg: 50 });
  });

  it('clamps implausible values from a misheard number', () => {
    expect(parseNumbers('300 sets of 10', 'kg')!.sets).toBe(20);
  });

  it('returns null when there is no quantity at all', () => {
    expect(parseNumbers('felt pretty good today', 'kg')).toBeNull();
  });
});

describe('parseWorkoutSpeech', () => {
  it('parses a single exercise', () => {
    const r = parse('bench press 3 sets of 10 at 60 kilos');
    expect(r.entries).toHaveLength(1);
    expect(r.entries[0].exerciseId).toBe('bench-press');
    expect(r.entries[0].sets).toEqual([
      { reps: 10, weight: 60 }, { reps: 10, weight: 60 }, { reps: 10, weight: 60 },
    ]);
  });

  it('reads "N of M" as sets of reps across a whole sentence', () => {
    const r = parse('lat pulldown 3 of 12 at 50');
    expect(r.entries[0].sets).toHaveLength(3);
    expect(r.entries[0].sets[0]).toEqual({ reps: 12, weight: 50 });
  });

  it('splits several exercises in one sentence', () => {
    const r = parse('squat 5 by 100 then leg press 3 sets of 12 at 80');
    expect(r.entries.map((e) => e.exerciseId)).toEqual(['back-squat', 'leg-press']);
    expect(r.entries[0].sets).toHaveLength(5);
    expect(r.entries[1].sets[0]).toEqual({ reps: 12, weight: 80 });
  });

  it('prefers the most specific exercise name', () => {
    expect(parse('incline dumbbell press 3 of 10 at 30').entries[0].exerciseId)
      .toBe('incline-db-press');
    // bare "bench" still resolves via the alias
    expect(parse('bench 3 of 10 at 60').entries[0].exerciseId).toBe('bench-press');
  });

  it('understands spoken number words', () => {
    const r = parse('lat pulldown three sets of twelve at fifty kilos');
    expect(r.entries[0].exerciseId).toBe('lat-pulldown');
    expect(r.entries[0].sets).toHaveLength(3);
    expect(r.entries[0].sets[0]).toEqual({ reps: 12, weight: 50 });
  });

  it('handles bodyweight exercises with no weight spoken', () => {
    const r = parse('pull ups 3 sets of 8');
    expect(r.entries[0].exerciseId).toBe('pull-up');
    expect(r.entries[0].sets[0]).toEqual({ reps: 8, weight: 0 });
  });

  it('reports speech that names no known exercise', () => {
    const r = parse('did some cardio for twenty minutes');
    expect(r.entries).toHaveLength(0);
    expect(r.unmatched).toHaveLength(1);
  });

  it('flags an exercise mentioned with no numbers', () => {
    const r = parse('bench press felt heavy');
    expect(r.entries).toHaveLength(0);
    expect(r.unmatched[0]).toContain('bench press');
  });

  it('is unfazed by punctuation and filler', () => {
    const r = parse('Okay, so, bench press: 3 sets of 10 at 60kg!');
    expect(r.entries).toHaveLength(1);
    expect(r.entries[0].sets[0]).toEqual({ reps: 10, weight: 60 });
  });

  it('returns nothing for empty input', () => {
    expect(parse('')).toEqual({ entries: [], unmatched: [] });
  });
});
