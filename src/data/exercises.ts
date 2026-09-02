import type { Exercise } from '../types';

/**
 * Built-in exercise library. Every entry maps to the muscle groups it trains so
 * a logged set can be turned into per-muscle volume and recovery cost.
 * `secondary` muscles are counted at half weight (see lib/volume.ts).
 */
export const EXERCISES: Exercise[] = [
  // ---- Chest ----
  { id: 'bench-press', name: 'Barbell Bench Press', equipment: 'barbell', primary: ['chest'], secondary: ['triceps', 'front-delts'], compound: true },
  { id: 'incline-bench', name: 'Incline Barbell Bench', equipment: 'barbell', primary: ['chest', 'front-delts'], secondary: ['triceps'], compound: true },
  { id: 'db-bench', name: 'Dumbbell Bench Press', equipment: 'dumbbell', primary: ['chest'], secondary: ['triceps', 'front-delts'], compound: true },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', equipment: 'dumbbell', primary: ['chest', 'front-delts'], secondary: ['triceps'], compound: true },
  { id: 'chest-press-machine', name: 'Chest Press Machine', equipment: 'machine', primary: ['chest'], secondary: ['triceps', 'front-delts'], compound: true },
  { id: 'cable-fly', name: 'Cable Fly', equipment: 'cable', primary: ['chest'], secondary: [], compound: false },
  { id: 'pec-deck', name: 'Pec Deck', equipment: 'machine', primary: ['chest'], secondary: [], compound: false },
  { id: 'dips', name: 'Chest Dips', equipment: 'bodyweight', primary: ['chest', 'triceps'], secondary: ['front-delts'], compound: true },
  { id: 'push-up', name: 'Push-Up', equipment: 'bodyweight', primary: ['chest'], secondary: ['triceps', 'front-delts', 'abs'], compound: true },

  // ---- Back ----
  { id: 'deadlift', name: 'Conventional Deadlift', equipment: 'barbell', primary: ['lower-back', 'hamstrings', 'glutes'], secondary: ['traps', 'lats', 'forearms', 'quads'], compound: true },
  { id: 'pull-up', name: 'Pull-Up', equipment: 'bodyweight', primary: ['lats'], secondary: ['biceps', 'rear-delts', 'forearms'], compound: true },
  { id: 'chin-up', name: 'Chin-Up', equipment: 'bodyweight', primary: ['lats', 'biceps'], secondary: ['forearms'], compound: true },
  { id: 'lat-pulldown', name: 'Lat Pulldown', equipment: 'cable', primary: ['lats'], secondary: ['biceps', 'rear-delts'], compound: true },
  { id: 'barbell-row', name: 'Barbell Row', equipment: 'barbell', primary: ['lats', 'traps'], secondary: ['biceps', 'rear-delts', 'lower-back'], compound: true },
  { id: 'db-row', name: 'One-Arm Dumbbell Row', equipment: 'dumbbell', primary: ['lats'], secondary: ['biceps', 'traps', 'rear-delts'], compound: true },
  { id: 'seated-cable-row', name: 'Seated Cable Row', equipment: 'cable', primary: ['lats', 'traps'], secondary: ['biceps', 'rear-delts'], compound: true },
  { id: 't-bar-row', name: 'T-Bar Row', equipment: 'machine', primary: ['lats', 'traps'], secondary: ['biceps', 'rear-delts'], compound: true },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Pulldown', equipment: 'cable', primary: ['lats'], secondary: [], compound: false },
  { id: 'shrug', name: 'Barbell Shrug', equipment: 'barbell', primary: ['traps'], secondary: ['forearms'], compound: false },
  { id: 'db-shrug', name: 'Dumbbell Shrug', equipment: 'dumbbell', primary: ['traps'], secondary: ['forearms'], compound: false },
  { id: 'back-extension', name: 'Back Extension', equipment: 'bodyweight', primary: ['lower-back'], secondary: ['glutes', 'hamstrings'], compound: false },
  { id: 'good-morning', name: 'Good Morning', equipment: 'barbell', primary: ['lower-back', 'hamstrings'], secondary: ['glutes'], compound: true },
  { id: 'rack-pull', name: 'Rack Pull', equipment: 'barbell', primary: ['lower-back', 'traps'], secondary: ['glutes', 'hamstrings', 'forearms'], compound: true },

  // ---- Shoulders ----
  { id: 'ohp', name: 'Overhead Press', equipment: 'barbell', primary: ['front-delts', 'side-delts'], secondary: ['triceps', 'traps', 'abs'], compound: true },
  { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', equipment: 'dumbbell', primary: ['front-delts', 'side-delts'], secondary: ['triceps'], compound: true },
  { id: 'arnold-press', name: 'Arnold Press', equipment: 'dumbbell', primary: ['front-delts', 'side-delts'], secondary: ['triceps'], compound: true },
  { id: 'lateral-raise', name: 'Lateral Raise', equipment: 'dumbbell', primary: ['side-delts'], secondary: [], compound: false },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', equipment: 'cable', primary: ['side-delts'], secondary: [], compound: false },
  { id: 'front-raise', name: 'Front Raise', equipment: 'dumbbell', primary: ['front-delts'], secondary: [], compound: false },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', equipment: 'dumbbell', primary: ['rear-delts'], secondary: ['traps'], compound: false },
  { id: 'face-pull', name: 'Face Pull', equipment: 'cable', primary: ['rear-delts', 'traps'], secondary: [], compound: false },
  { id: 'upright-row', name: 'Upright Row', equipment: 'barbell', primary: ['side-delts', 'traps'], secondary: ['biceps'], compound: true },

  // ---- Arms ----
  { id: 'barbell-curl', name: 'Barbell Curl', equipment: 'barbell', primary: ['biceps'], secondary: ['forearms'], compound: false },
  { id: 'db-curl', name: 'Dumbbell Curl', equipment: 'dumbbell', primary: ['biceps'], secondary: ['forearms'], compound: false },
  { id: 'hammer-curl', name: 'Hammer Curl', equipment: 'dumbbell', primary: ['biceps', 'forearms'], secondary: [], compound: false },
  { id: 'preacher-curl', name: 'Preacher Curl', equipment: 'machine', primary: ['biceps'], secondary: ['forearms'], compound: false },
  { id: 'cable-curl', name: 'Cable Curl', equipment: 'cable', primary: ['biceps'], secondary: ['forearms'], compound: false },
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', equipment: 'barbell', primary: ['triceps'], secondary: ['chest', 'front-delts'], compound: true },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', equipment: 'cable', primary: ['triceps'], secondary: [], compound: false },
  { id: 'overhead-tricep-ext', name: 'Overhead Tricep Extension', equipment: 'dumbbell', primary: ['triceps'], secondary: [], compound: false },
  { id: 'skullcrusher', name: 'Skullcrusher', equipment: 'barbell', primary: ['triceps'], secondary: [], compound: false },
  { id: 'tricep-dip', name: 'Bench Dip', equipment: 'bodyweight', primary: ['triceps'], secondary: ['chest', 'front-delts'], compound: true },
  { id: 'wrist-curl', name: 'Wrist Curl', equipment: 'dumbbell', primary: ['forearms'], secondary: [], compound: false },
  { id: 'farmers-walk', name: "Farmer's Walk", equipment: 'dumbbell', primary: ['forearms', 'traps'], secondary: ['abs', 'quads'], compound: true },

  // ---- Legs ----
  { id: 'back-squat', name: 'Back Squat', equipment: 'barbell', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lower-back', 'abs'], compound: true },
  { id: 'front-squat', name: 'Front Squat', equipment: 'barbell', primary: ['quads'], secondary: ['glutes', 'abs', 'lower-back'], compound: true },
  { id: 'leg-press', name: 'Leg Press', equipment: 'machine', primary: ['quads', 'glutes'], secondary: ['hamstrings'], compound: true },
  { id: 'hack-squat', name: 'Hack Squat', equipment: 'machine', primary: ['quads'], secondary: ['glutes'], compound: true },
  { id: 'lunge', name: 'Walking Lunge', equipment: 'dumbbell', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'], compound: true },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', equipment: 'dumbbell', primary: ['quads', 'glutes'], secondary: ['hamstrings'], compound: true },
  { id: 'leg-extension', name: 'Leg Extension', equipment: 'machine', primary: ['quads'], secondary: [], compound: false },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', equipment: 'barbell', primary: ['hamstrings', 'glutes'], secondary: ['lower-back', 'forearms'], compound: true },
  { id: 'leg-curl', name: 'Lying Leg Curl', equipment: 'machine', primary: ['hamstrings'], secondary: ['calves'], compound: false },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', equipment: 'machine', primary: ['hamstrings'], secondary: [], compound: false },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', equipment: 'barbell', primary: ['glutes'], secondary: ['hamstrings'], compound: true },
  { id: 'glute-bridge', name: 'Glute Bridge', equipment: 'bodyweight', primary: ['glutes'], secondary: ['hamstrings'], compound: false },
  { id: 'hip-abduction', name: 'Hip Abduction Machine', equipment: 'machine', primary: ['glutes'], secondary: [], compound: false },
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', equipment: 'machine', primary: ['calves'], secondary: [], compound: false },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', equipment: 'machine', primary: ['calves'], secondary: [], compound: false },

  // ---- Core ----
  { id: 'plank', name: 'Plank', equipment: 'bodyweight', primary: ['abs'], secondary: ['obliques', 'lower-back'], compound: false },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', equipment: 'bodyweight', primary: ['abs'], secondary: ['obliques', 'forearms'], compound: false },
  { id: 'cable-crunch', name: 'Cable Crunch', equipment: 'cable', primary: ['abs'], secondary: ['obliques'], compound: false },
  { id: 'crunch', name: 'Crunch', equipment: 'bodyweight', primary: ['abs'], secondary: [], compound: false },
  { id: 'russian-twist', name: 'Russian Twist', equipment: 'bodyweight', primary: ['obliques'], secondary: ['abs'], compound: false },
  { id: 'side-plank', name: 'Side Plank', equipment: 'bodyweight', primary: ['obliques'], secondary: ['abs'], compound: false },
  { id: 'pallof-press', name: 'Pallof Press', equipment: 'cable', primary: ['obliques', 'abs'], secondary: [], compound: false },
];

export const EXERCISES_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);
