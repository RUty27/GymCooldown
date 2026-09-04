import { useState } from 'react';
import type { Store } from '../hooks/useSessions';
import {
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from '../types';

const EQUIPMENT: Equipment[] = ['machine', 'barbell', 'dumbbell', 'cable', 'bodyweight'];

/**
 * Add a machine that is not in the built-in library — most gyms have their own.
 * The muscles chosen here drive that exercise's volume and recovery, so the
 * form insists on at least one primary muscle.
 */
export function CustomExerciseForm({
  store,
  initialName = '',
  onCreated,
  onClose,
}: {
  store: Store;
  initialName?: string;
  onCreated: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [equipment, setEquipment] = useState<Equipment>('machine');
  const [primary, setPrimary] = useState<MuscleGroup[]>([]);
  const [secondary, setSecondary] = useState<MuscleGroup[]>([]);
  const [compound, setCompound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (
    list: MuscleGroup[],
    set: (v: MuscleGroup[]) => void,
    other: MuscleGroup[],
    setOther: (v: MuscleGroup[]) => void,
    m: MuscleGroup,
  ) => {
    if (list.includes(m)) set(list.filter((x) => x !== m));
    else {
      set([...list, m]);
      // A muscle cannot be both primary and secondary, or it would be counted twice.
      if (other.includes(m)) setOther(other.filter((x) => x !== m));
    }
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('Give the exercise a name.');
    if (primary.length === 0) {
      return setError('Pick at least one main muscle — this drives the rest recommendations.');
    }
    if (store.exercises.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) {
      return setError('You already have an exercise with that name.');
    }
    onCreated(
      store.addCustomExercise({ name: trimmed, equipment, primary, secondary, compound }),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="flex items-center justify-between border-b border-edge p-3">
        <h2 className="font-semibold">Add your own exercise</h2>
        <button onClick={onClose} className="px-2 py-1 text-sm text-slate-400">
          Cancel
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label htmlFor="cx-name" className="mb-1 block text-xs text-slate-500">
            Name — copy what is written on the machine
          </label>
          <input
            id="cx-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fixed Pulldown"
            className="w-full rounded-lg border border-edge bg-panel px-3 py-2.5 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div>
          <span className="mb-1 block text-xs text-slate-500">Equipment</span>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPMENT.map((eq) => (
              <button
                key={eq}
                onClick={() => setEquipment(eq)}
                className={`rounded-full border px-3 py-1.5 text-xs capitalize ${
                  equipment === eq
                    ? 'border-sky-600 bg-sky-900/40 text-sky-300'
                    : 'border-edge text-slate-400'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        <MusclePicker
          title="Main muscles worked"
          hint="The ones that get sore. Required."
          selected={primary}
          onToggle={(m) => toggle(primary, setPrimary, secondary, setSecondary, m)}
        />

        <MusclePicker
          title="Also worked (optional)"
          hint="Assisting muscles — these count for half."
          selected={secondary}
          onToggle={(m) => toggle(secondary, setSecondary, primary, setPrimary, m)}
        />

        <label className="flex items-start gap-3 rounded-lg border border-edge bg-panel p-3">
          <input
            type="checkbox"
            checked={compound}
            onChange={(e) => setCompound(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span className="text-sm text-slate-300">
            Uses several joints at once
            <span className="mt-0.5 block text-xs text-slate-500">
              Like a press, row or squat rather than a curl. These need longer rest.
            </span>
          </span>
        </label>

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      <div className="border-t border-edge p-4 pb-8">
        <button
          onClick={submit}
          className="w-full rounded-lg bg-slate-100 py-3 font-semibold text-slate-900"
        >
          Save exercise
        </button>
      </div>
    </div>
  );
}

function MusclePicker({
  title,
  hint,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  selected: MuscleGroup[];
  onToggle: (m: MuscleGroup) => void;
}) {
  return (
    <div>
      <span className="block text-xs text-slate-500">{title}</span>
      <span className="mb-1.5 block text-[11px] text-slate-600">{hint}</span>
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_GROUPS.map((m) => (
          <button
            key={m}
            onClick={() => onToggle(m)}
            aria-pressed={selected.includes(m)}
            className={`rounded-full border px-2.5 py-1.5 text-xs ${
              selected.includes(m)
                ? 'border-sky-600 bg-sky-900/40 text-sky-300'
                : 'border-edge text-slate-400'
            }`}
          >
            {MUSCLE_LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
