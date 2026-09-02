export const MUSCLE_GROUPS = [
  'chest',
  'front-delts',
  'side-delts',
  'rear-delts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'lats',
  'traps',
  'lower-back',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  'front-delts': 'Front Delts',
  'side-delts': 'Side Delts',
  'rear-delts': 'Rear Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  lats: 'Lats',
  traps: 'Traps',
  'lower-back': 'Lower Back',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
};

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';

export interface Exercise {
  id: string;
  name: string;
  equipment: Equipment;
  /** Muscles that take the full recovery + volume cost. */
  primary: MuscleGroup[];
  /** Muscles that assist; counted at half weight. */
  secondary: MuscleGroup[];
  /** Multi-joint lifts cost more recovery and need longer rest between sets. */
  compound: boolean;
}

export interface SetEntry {
  reps: number;
  /** Stored in kilograms; converted for display when the user picks lb. */
  weight: number;
  rpe?: number;
}

export interface LoggedExercise {
  exerciseId: string;
  sets: SetEntry[];
}

export interface Session {
  id: string;
  /** ISO timestamp of when the session was logged. */
  date: string;
  exercises: LoggedExercise[];
  notes?: string;
}

export type Unit = 'kg' | 'lb';

export interface Settings {
  unit: Unit;
}

/** Everything persisted to disk, wrapped with a version for future migrations. */
export interface AppData {
  version: 1;
  sessions: Session[];
  settings: Settings;
  /** User-defined exercises, merged over the built-in library. */
  customExercises: Exercise[];
}
