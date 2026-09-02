import { useId, useMemo, useState } from 'react';
import type { Store } from '../hooks/useSessions';
import { restBetweenSets, typicalReps } from '../lib/restTimer';
import { formatWeight, fromDisplay, toDisplay } from '../lib/units';
import { exerciseTonnage } from '../lib/volume';
import { MUSCLE_LABELS, type Exercise, type LoggedExercise, type SetEntry } from '../types';

export function LogWorkout({ store }: { store: Store }) {
  const [draft, setDraft] = useState<LoggedExercise[]>([]);
  const [picking, setPicking] = useState(false);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const unit = store.data.settings.unit;

  const totalSets = draft.reduce((n, d) => n + d.sets.length, 0);
  const totalTonnage = draft.reduce((n, d) => n + exerciseTonnage(d.sets), 0);

  const addExercise = (ex: Exercise) => {
    setPicking(false);
    setDraft((d) =>
      d.some((x) => x.exerciseId === ex.id) ? d : [...d, { exerciseId: ex.id, sets: [] }],
    );
  };

  const updateSets = (exerciseId: string, sets: SetEntry[]) =>
    setDraft((d) => d.map((x) => (x.exerciseId === exerciseId ? { ...x, sets } : x)));

  const removeExercise = (exerciseId: string) =>
    setDraft((d) => d.filter((x) => x.exerciseId !== exerciseId));

  const finish = () => {
    const withSets = draft.filter((d) => d.sets.length > 0);
    if (withSets.length === 0) return;
    store.addSession(withSets, notes.trim() || undefined);
    setDraft([]);
    setNotes('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-3 pb-4">
      {saved && (
        <p className="rounded-lg border border-green-800 bg-green-900/40 px-3 py-2 text-sm text-green-300">
          Session saved. Check the Body tab to see what is now recovering.
        </p>
      )}

      {draft.length === 0 && (
        <div className="rounded-xl border border-dashed border-edge p-6 text-center">
          <p className="text-sm text-slate-400">
            No exercises yet. Add what you are training today.
          </p>
        </div>
      )}

      {draft.map((logged) => {
        const ex = store.lookup(logged.exerciseId);
        if (!ex) return null;
        return (
          <ExerciseCard
            key={logged.exerciseId}
            exercise={ex}
            logged={logged}
            unit={unit}
            store={store}
            onChange={(sets) => updateSets(logged.exerciseId, sets)}
            onRemove={() => removeExercise(logged.exerciseId)}
          />
        );
      })}

      <button
        onClick={() => setPicking(true)}
        className="w-full rounded-lg border border-edge bg-panel py-3 font-medium text-slate-200"
      >
        + Add exercise
      </button>

      {draft.length > 0 && (
        <>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Session notes (optional)"
            className="w-full rounded-lg border border-edge bg-panel px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <div className="flex items-center justify-between rounded-lg border border-edge bg-panel px-3 py-2 text-sm text-slate-400">
            <span>
              {totalSets} set{totalSets === 1 ? '' : 's'}
            </span>
            <span className="tabular-nums">
              {Math.round(toDisplay(totalTonnage, unit)).toLocaleString()} {unit} total
            </span>
          </div>
          <button
            onClick={finish}
            disabled={totalSets === 0}
            className="w-full rounded-lg bg-slate-100 py-3 font-semibold text-slate-900 disabled:opacity-40"
          >
            Finish workout
          </button>
        </>
      )}

      {picking && (
        <ExercisePicker
          store={store}
          onPick={addExercise}
          onClose={() => setPicking(false)}
          alreadyAdded={draft.map((d) => d.exerciseId)}
        />
      )}
    </div>
  );
}

function ExerciseCard({
  exercise,
  logged,
  unit,
  store,
  onChange,
  onRemove,
}: {
  exercise: Exercise;
  logged: LoggedExercise;
  unit: 'kg' | 'lb';
  store: Store;
  onChange: (sets: SetEntry[]) => void;
  onRemove: () => void;
}) {
  const last = store.lastPerformance(exercise.id);
  const lastSet = last?.logged.sets[last.logged.sets.length - 1];

  // Seed a new set from the previous one in this session, else from last time.
  const seed: SetEntry = logged.sets[logged.sets.length - 1] ??
    lastSet ?? { reps: 10, weight: 0 };

  const [reps, setReps] = useState(seed.reps);
  const [weight, setWeight] = useState(() => toDisplay(seed.weight, unit));

  const rest = restBetweenSets(exercise, typicalReps(logged.sets.length ? logged.sets : [seed]));

  const addSet = () =>
    onChange([...logged.sets, { reps, weight: fromDisplay(weight, unit) }]);

  return (
    <section className="rounded-xl border border-edge bg-panel p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-100">{exercise.name}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {exercise.primary.map((m) => MUSCLE_LABELS[m]).join(' · ')}
          </p>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Remove ${exercise.name}`}
          className="shrink-0 rounded px-2 py-1 text-sm text-slate-500 hover:text-red-400"
        >
          ✕
        </button>
      </div>

      <p className="mt-2 rounded-md bg-ink/60 px-2 py-1.5 text-xs text-slate-400">
        Rest ~<span className="font-medium text-slate-200">{rest.label}</span> between sets ·{' '}
        {rest.reason}
      </p>

      {last && lastSet && (
        <p className="mt-1.5 text-xs text-slate-500">
          Last time: {last.logged.sets.length} × {lastSet.reps} @{' '}
          {formatWeight(lastSet.weight, unit)}
        </p>
      )}

      {logged.sets.length > 0 && (
        <ol className="mt-2 space-y-1">
          {logged.sets.map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md bg-ink/60 px-2.5 py-1.5 text-sm"
            >
              <span className="text-slate-500">Set {i + 1}</span>
              <span className="tabular-nums text-slate-200">
                {s.reps} reps @ {formatWeight(s.weight, unit)}
              </span>
              <button
                onClick={() => onChange(logged.sets.filter((_, j) => j !== i))}
                aria-label={`Delete set ${i + 1}`}
                className="text-xs text-slate-500 hover:text-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-2.5 flex items-end gap-2">
        <Stepper label="Reps" value={reps} step={1} min={1} onChange={setReps} />
        <Stepper
          label={`Weight (${unit})`}
          value={weight}
          step={unit === 'kg' ? 2.5 : 5}
          min={0}
          onChange={setWeight}
        />
        <button
          onClick={addSet}
          className="h-10 shrink-0 rounded-lg bg-slate-100 px-4 font-medium text-slate-900"
        >
          Add set
        </button>
      </div>
    </section>
  );
}

function Stepper({
  label,
  value,
  step,
  min,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  onChange: (n: number) => void;
}) {
  const id = useId();
  const bump = (delta: number) =>
    onChange(Math.max(min, Math.round((value + delta) * 100) / 100));

  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1 block text-xs text-slate-500">
        {label}
      </label>
      <div className="flex h-10 items-stretch overflow-hidden rounded-lg border border-edge bg-ink/60">
        <button
          onClick={() => bump(-step)}
          aria-label={`Decrease ${label}`}
          className="w-8 shrink-0 text-slate-400"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-full min-w-0 bg-transparent text-center tabular-nums text-slate-100 outline-none"
        />
        <button
          onClick={() => bump(step)}
          aria-label={`Increase ${label}`}
          className="w-8 shrink-0 text-slate-400"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ExercisePicker({
  store,
  onPick,
  onClose,
  alreadyAdded,
}: {
  store: Store;
  onPick: (ex: Exercise) => void;
  onClose: () => void;
  alreadyAdded: string[];
}) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return store.exercises;
    return store.exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.equipment.includes(q) ||
        e.primary.some((m) => MUSCLE_LABELS[m].toLowerCase().includes(q)),
    );
  }, [query, store.exercises]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink">
      <div className="flex items-center gap-2 border-b border-edge p-3">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercise or muscle…"
          className="w-full rounded-lg border border-edge bg-panel px-3 py-2.5 text-slate-100 placeholder:text-slate-500"
        />
        <button onClick={onClose} className="shrink-0 px-2 py-2 text-sm text-slate-400">
          Cancel
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {results.length === 0 && (
          <li className="p-6 text-center text-sm text-slate-500">No matches.</li>
        )}
        {results.map((e) => (
          <li key={e.id}>
            <button
              onClick={() => onPick(e)}
              disabled={alreadyAdded.includes(e.id)}
              className="flex w-full items-center justify-between gap-3 border-b border-edge/60 px-4 py-3 text-left disabled:opacity-40"
            >
              <span className="min-w-0">
                <span className="block truncate text-slate-100">{e.name}</span>
                <span className="block truncate text-xs text-slate-500">
                  {e.primary.map((m) => MUSCLE_LABELS[m]).join(' · ')}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-edge px-2 py-0.5 text-[10px] uppercase text-slate-500">
                {e.equipment}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
