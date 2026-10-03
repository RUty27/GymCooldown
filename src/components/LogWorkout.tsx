import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { Store } from '../hooks/useSessions';
import {
  calendarDaysAgo,
  clampToNow,
  describeSessionDate,
  fromLocalInputValue,
  shiftDays,
  toLocalInputValue,
} from '../lib/datetime';
import { DEFAULT_BOOK_URL } from '../lib/gymLinks';
import { formatRestRemaining, muscleStatus } from '../lib/recovery';
import { restBetweenSets, typicalReps } from '../lib/restTimer';
import { formatWeight, fromDisplay, toDisplay } from '../lib/units';
import { isLinkedToNext, linkWithNext, normalizeSupersets, supersetLabels, unlinkFromNext } from '../lib/superset';
import { exerciseTonnage } from '../lib/volume';
import { CustomExerciseForm } from './CustomExerciseForm';
import { ExercisePhoto } from './ExercisePhoto';
import { NumberPadSheet, type PadField } from './NumberPadSheet';
import { VoiceLogger, isVoiceSupported } from './VoiceLogger';
import { PrimaryButton, SecondaryButton, Sheet, Tag } from './ui';
import {
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  type Exercise,
  type LoggedExercise,
  type SetEntry,
  type Unit,
} from '../types';

/** The in-progress workout, owned by App so it survives tab switches. */
export interface WorkoutDraft {
  draft: LoggedExercise[];
  setDraft: Dispatch<SetStateAction<LoggedExercise[]>>;
  notes: string;
  setNotes: (notes: string) => void;
  workoutDate: string | null;
  setWorkoutDate: (date: string | null) => void;
  highlightId: string | null;
}

export function LogWorkout({ store, workout }: { store: Store; workout: WorkoutDraft }) {
  const { draft, setDraft, notes, setNotes, workoutDate, setWorkoutDate, highlightId } = workout;
  const [picking, setPicking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [toast, setToast] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unit = store.data.settings.unit;
  const labels = useMemo(() => supersetLabels(draft), [draft]);
  const totalSets = draft.reduce((n, d) => n + d.sets.length, 0);
  const totalTonnage = draft.reduce((n, d) => n + exerciseTonnage(d.sets), 0);

  // The highlighted card (added from the body map) opens itself.
  const openId = highlightId ?? expandedId;

  const addExercise = (ex: Exercise) => {
    setPicking(false);
    setDraft((d) => (d.some((x) => x.exerciseId === ex.id) ? d : [...d, { exerciseId: ex.id, sets: [] }]));
    setExpandedId(ex.id);
  };

  const updateSets = (exerciseId: string, sets: SetEntry[]) =>
    setDraft((d) => d.map((x) => (x.exerciseId === exerciseId ? { ...x, sets } : x)));

  const removeExercise = (exerciseId: string) =>
    setDraft((d) => normalizeSupersets(d.filter((x) => x.exerciseId !== exerciseId)));

  const toggleSuperset = (index: number) =>
    setDraft((d) => (isLinkedToNext(d, index) ? unlinkFromNext(d, index) : linkWithNext(d, index)));

  /** Merge voice-parsed exercises in, appending sets to anything already logged. */
  const addFromVoice = (entries: LoggedExercise[]) => {
    setSpeaking(false);
    setDraft((d) => {
      const next = [...d];
      for (const entry of entries) {
        const existing = next.findIndex((x) => x.exerciseId === entry.exerciseId);
        if (existing >= 0) next[existing] = { ...next[existing], sets: [...next[existing].sets, ...entry.sets] };
        else next.push(entry);
      }
      return next;
    });
  };

  const finish = () => {
    const withSets = normalizeSupersets(draft.filter((d) => d.sets.length > 0));
    if (withSets.length === 0) return;
    store.addSession(withSets, notes.trim() || undefined, workoutDate ?? undefined);
    setDraft([]);
    setNotes('');
    setWorkoutDate(null);
    setFinishing(false);
    setExpandedId(null);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  return (
    <div className="px-4 pb-4 lg:px-[30px] lg:pb-7">
      <header className="flex items-start justify-between gap-3 px-1 pb-[14px] pt-[18px] lg:pt-7">
        <div>
          <h1 className="font-display text-[24px] lg:text-[30px]">
            <span className="lg:hidden">
              Gym<span className="text-accent-700 dark:text-accent-300">Cooldown</span>
            </span>
            <span className="hidden lg:inline">Today's session</span>
          </h1>
          <p className="text-[12px] text-[color:var(--muted)] lg:text-[13px]">
            <span className="lg:hidden">Today's session · </span>
            {draft.length} lift{draft.length === 1 ? '' : 's'} · {totalSets} set
            {totalSets === 1 ? '' : 's'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-[22px] text-accent-600 dark:text-accent-400">
            {Math.round(toDisplay(totalTonnage, unit)).toLocaleString()}
          </p>
          <p className="eyebrow">{unit} so far</p>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-[14px]">
        <GymAccess bookUrl={store.data.settings.bookUrl} doorUrl={store.data.settings.doorUrl} />

        {draft.length === 0 && (
          <div className="rounded-card border-[1.5px] border-dashed border-[color:var(--dashed)] p-6 text-center text-[14px] text-[color:var(--muted)]">
            No exercises yet. Add what you are training today.
          </div>
        )}

        {draft.map((logged, index) => {
          const ex = store.lookup(logged.exerciseId);
          if (!ex) return null;
          const linked = isLinkedToNext(draft, index);
          return (
            <div key={logged.exerciseId} className="flex flex-col gap-[14px]">
            <ExerciseCard
              exercise={ex}
              supersetLabel={logged.supersetId ? labels.get(logged.supersetId) : undefined}
              logged={logged}
              unit={unit}
              store={store}
              expanded={openId === logged.exerciseId}
              highlight={highlightId === logged.exerciseId}
              onExpand={() => setExpandedId(logged.exerciseId)}
              onChange={(sets) => updateSets(logged.exerciseId, sets)}
              onRemove={() => removeExercise(logged.exerciseId)}
            />
            {index < draft.length - 1 && (
              <button
                onClick={() => toggleSuperset(index)}
                className={`font-display -my-1 self-center rounded-full px-4 py-1.5 text-[12px] ${
                  linked
                    ? 'bg-accent text-bg'
                    : 'border border-dashed border-[color:var(--dashed)] text-[color:var(--muted)]'
                }`}
              >
                {linked ? '🔗 Superset · tap to unlink' : '＋ Superset with next'}
              </button>
            )}
            </div>
          );
        })}

        <button
          onClick={() => setPicking(true)}
          className="font-display w-full rounded-full border-[1.5px] border-dashed border-[color:var(--dashed)] py-[14px] text-[15px] text-[color:var(--muted)]"
        >
          + Add exercise
        </button>

        {totalSets > 0 && (
          <PrimaryButton onClick={() => setFinishing(true)} className="w-full">
            Finish workout
          </PrimaryButton>
        )}
      </div>

      <RecoveredPanel store={store} />
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-40 mx-auto w-fit max-w-[92%] rounded-full bg-surface px-5 py-3 text-[13px] shadow-md">
          Session saved. Check the Body tab to see what is now recovering.
        </div>
      )}

      {finishing && (
        <Sheet onClose={() => setFinishing(false)} ariaLabel="Finish workout">
          <h2 className="font-display text-[20px]">Finish workout</h2>
          <div className="mt-3 flex items-baseline justify-between rounded-panel bg-bg px-4 py-3">
            <span className="text-[13px] text-[color:var(--muted)]">
              {totalSets} set{totalSets === 1 ? '' : 's'} · {draft.length} lift
              {draft.length === 1 ? '' : 's'}
            </span>
            <span className="font-display text-[20px] text-accent-600 dark:text-accent-400">
              {Math.round(toDisplay(totalTonnage, unit)).toLocaleString()} {unit}
            </span>
          </div>

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Session notes (optional)"
            className="mt-3 w-full rounded-full border border-[color:var(--divider)] bg-bg px-4 py-3 text-[14px] text-ink placeholder:text-[color:var(--muted)]"
          />

          <WorkoutDateField value={workoutDate} onChange={setWorkoutDate} />

          <PrimaryButton onClick={finish} className="mt-4 w-full">
            Save session
          </PrimaryButton>
        </Sheet>
      )}

      {speaking && <VoiceLogger store={store} onApply={addFromVoice} onClose={() => setSpeaking(false)} />}

      {picking && (
        <ExercisePicker
          store={store}
          onPick={addExercise}
          onClose={() => setPicking(false)}
          onVoice={() => {
            setPicking(false);
            setSpeaking(true);
          }}
          alreadyAdded={draft.map((d) => d.exerciseId)}
        />
      )}
    </div>
  );
}

/** Wide-screen right column: what you are clear to train right now. */
function RecoveredPanel({ store }: { store: Store }) {
  const resting = useMemo(() => {
    const now = Date.now();
    return MUSCLE_GROUPS.map((m) => muscleStatus(m, store.data.sessions, store.lookup, now))
      .filter((s) => s.state === 'recovering')
      .sort((a, b) => a.recoveryPct - b.recoveryPct);
  }, [store.data.sessions, store.lookup]);

  return (
    <aside className="hidden lg:block">
      <h2 className="font-display mb-2 text-[20px]">What's recovered</h2>
      <div className="rounded-card bg-surface p-[18px] shadow-sm">
        {resting.length === 0 ? (
          <p className="text-[13px] text-[color:var(--muted)]">
            Nothing is mid-recovery — you are clear to train anything.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {resting.map((s) => (
              <li
                key={s.muscle}
                className="flex items-center justify-between gap-3 rounded-full bg-bg px-4 py-2.5"
              >
                <span className="text-[14px]">{MUSCLE_LABELS[s.muscle]}</span>
                <span className="text-[12px] text-accent-700 dark:text-accent-300">
                  {formatRestRemaining(s)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

/**
 * When the workout happened. Defaults to now, with one tap for "yesterday"
 * (logging the morning after is the common case) and a full picker for
 * anything else. Capped at the present, since a future-dated session would be
 * skipped by the recovery calculations.
 */
function WorkoutDateField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (date: string | null) => void;
}) {
  const now = new Date().toISOString();
  const effective = value ?? now;
  const isToday = calendarDaysAgo(effective) === 0;
  const isYesterday = calendarDaysAgo(effective) === 1;

  const pill = (active: boolean) =>
    `flex-1 rounded-full py-2 text-[13px] transition-colors duration-100 ${
      active
        ? 'font-display bg-accent text-bg'
        : 'border border-[color:var(--divider)] text-[color:var(--muted)]'
    }`;

  return (
    <div className="mt-3 rounded-panel bg-bg p-4">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">When was this workout?</span>
        <span className="text-[12px] text-[color:var(--muted)]">
          {describeSessionDate(effective)}
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => onChange(null)} className={pill(value === null || isToday)}>
          Today
        </button>
        <button
          onClick={() => onChange(clampToNow(shiftDays(new Date().toISOString(), -1)))}
          className={pill(value !== null && isYesterday)}
        >
          Yesterday
        </button>
      </div>
      <input
        type="datetime-local"
        aria-label="Workout date and time"
        value={toLocalInputValue(effective)}
        max={toLocalInputValue(now)}
        onChange={(e) => {
          const iso = fromLocalInputValue(e.target.value);
          onChange(iso ? clampToNow(iso) : null);
        }}
        className="mt-2 w-full rounded-full border border-[color:var(--divider)] bg-surface px-4 py-2.5 text-[14px] text-ink"
      />
    </div>
  );
}

function ExerciseCard({
  exercise,
  logged,
  unit,
  store,
  expanded,
  highlight,
  supersetLabel,
  onExpand,
  onChange,
  onRemove,
}: {
  supersetLabel?: string;
  exercise: Exercise;
  logged: LoggedExercise;
  unit: Unit;
  store: Store;
  expanded: boolean;
  highlight: boolean;
  onExpand: () => void;
  onChange: (sets: SetEntry[]) => void;
  onRemove: () => void;
}) {
  const last = store.lastPerformance(exercise.id);
  const lastSet = last?.logged.sets[last.logged.sets.length - 1];
  const seed: SetEntry = logged.sets[logged.sets.length - 1] ?? lastSet ?? { reps: 10, weight: 0 };

  const [reps, setReps] = useState(seed.reps);
  const [weight, setWeight] = useState(() => toDisplay(seed.weight, unit));
  const [pad, setPad] = useState<PadField | null>(null);

  const rest = restBetweenSets(exercise, typicalReps(logged.sets.length ? logged.sets : [seed]));
  const step = unit === 'kg' ? 2.5 : 5;
  const repChips = [reps - 4, reps - 2, reps, reps + 2, reps + 5].filter((n) => n >= 1);
  const weightChips = [weight - 2 * step, weight - step, weight, weight + step, weight + 2 * step]
    .filter((n) => n >= 0)
    .map((n) => Math.round(n * 100) / 100);

  const addSet = () => onChange([...logged.sets, { reps, weight: fromDisplay(weight, unit) }]);

  const ring = highlight
    ? 'border-[1.5px] border-accent shadow-[0_0_0_4px_rgba(198,113,57,.18)]'
    : 'border border-transparent';

  if (!expanded) {
    return (
      <section className={`rounded-card bg-surface p-[18px] shadow-sm ${ring}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display truncate text-[20px]">{exercise.name}</h3>
            <p className="text-[12px] text-[color:var(--muted)]">
              {logged.sets.length === 0
                ? `No sets yet · rest ${rest.label}`
                : `${logged.sets.length} set${logged.sets.length === 1 ? '' : 's'} · rest ${rest.label}`}
              {supersetLabel && ` · Superset ${supersetLabel}`}
            </p>
          </div>
          <button
            onClick={onExpand}
            className="font-display h-9 shrink-0 rounded-full border-[1.5px] border-accent px-[18px] text-[14px] text-accent-700 dark:text-accent-300"
          >
            {logged.sets.length === 0 ? 'Start' : 'Open'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`rounded-card bg-surface p-[18px] shadow-sm lg:p-[22px] ${ring}`}>
      {highlight && (
        <p className="mb-2 text-[12px] text-accent-700 dark:text-accent-300">
          Added from the body map — add your sets
        </p>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display truncate text-[20px] lg:text-[22px]">{exercise.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {exercise.primary.map((m) => (
              <Tag key={m} tone="accent">
                {MUSCLE_LABELS[m]}
              </Tag>
            ))}
            <Tag tone="neutral">{exercise.equipment}</Tag>
            <Tag tone="accent2">Rest {rest.label}</Tag>
            {supersetLabel && <Tag tone="accent">Superset {supersetLabel}</Tag>}
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Remove ${exercise.name}`}
          className="h-[30px] w-[30px] shrink-0 rounded-full border border-[color:var(--divider)] text-[color:var(--muted)]"
        >
          ✕
        </button>
      </div>

      <ExercisePhoto exerciseId={exercise.id} exerciseName={exercise.name} />

      {logged.sets.length > 0 && (
        <ol className="mt-3 flex flex-col gap-1.5 lg:grid lg:grid-cols-2">
          {logged.sets.map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-full bg-bg py-2 pl-4 pr-[10px]"
            >
              <span className="font-display flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-bg">
                {i + 1}
              </span>
              <span className="flex-1 text-[15px] tabular-nums">
                {s.reps} × {formatWeight(s.weight, unit)}
              </span>
              <span className="text-[11px] tabular-nums text-[color:var(--muted)]">
                {Math.round(s.reps * toDisplay(s.weight, unit)).toLocaleString()}
              </span>
              <button
                onClick={() => onChange(logged.sets.filter((_, j) => j !== i))}
                aria-label={`Delete set ${i + 1}`}
                className="-my-2 h-11 w-11 shrink-0 rounded-full text-[color:var(--muted)]"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-[10px] flex gap-[10px] lg:items-end">
        <FieldButton
          label="Reps"
          value={String(reps)}
          active={pad === 'reps'}
          onClick={() => setPad('reps')}
          className="flex-1"
        />
        <FieldButton
          label={`Weight ${unit}`}
          value={String(weight)}
          active={pad === 'weight'}
          onClick={() => setPad('weight')}
          className="flex-[1.3]"
        />
        <PrimaryButton onClick={addSet} className="hidden shrink-0 px-[30px] py-4 lg:block">
          Add set
        </PrimaryButton>
      </div>

      <ChipRow
        values={pad === 'weight' ? weightChips : repChips}
        selected={pad === 'weight' ? weight : reps}
        onPick={(v) => (pad === 'weight' ? setWeight(v) : setReps(v))}
      />

      <PrimaryButton onClick={addSet} className="mt-[10px] w-full lg:hidden">
        Add set
      </PrimaryButton>

      {last && lastSet && (
        <p className="mt-3 text-[12px] text-[color:var(--muted)]">
          Last time · {last.logged.sets.length} × {lastSet.reps} @ {formatWeight(lastSet.weight, unit)}
        </p>
      )}

      {pad && (
        <NumberPadSheet
          field={pad}
          unit={unit}
          initial={pad === 'reps' ? reps : weight}
          context={`Set ${logged.sets.length + 1} · ${exercise.name}`}
          chips={pad === 'weight' ? weightChips : repChips}
          summary={(v) =>
            pad === 'reps'
              ? `Set reps · ${v} × ${weight} ${unit}`
              : `Set weight · ${reps} × ${v} ${unit}`
          }
          onCommit={(v) => {
            if (pad === 'reps') setReps(v);
            else setWeight(v);
            setPad(null);
          }}
          onClose={() => setPad(null)}
        />
      )}
    </section>
  );
}

function FieldButton({
  label,
  value,
  active,
  onClick,
  className = '',
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-inner bg-bg px-[14px] py-[10px] text-left transition-colors duration-100 ${
        active ? 'border-[1.5px] border-accent' : 'border-[1.5px] border-[color:var(--divider)]'
      } ${className}`}
    >
      <span className="eyebrow block">{label}</span>
      <span className="font-display block text-[30px]">{value}</span>
    </button>
  );
}

function ChipRow({
  values,
  selected,
  onPick,
}: {
  values: number[];
  selected: number;
  onPick: (v: number) => void;
}) {
  return (
    <div className="-mx-[18px] mt-[10px] flex gap-1.5 overflow-x-auto px-[18px] pb-1">
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onPick(v)}
          className={`shrink-0 rounded-full px-[14px] py-1.5 text-[13px] transition-colors duration-100 ${
            v === selected
              ? 'bg-accent text-bg'
              : 'bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function ExercisePicker({
  store,
  onPick,
  onClose,
  onVoice,
  alreadyAdded,
}: {
  store: Store;
  onPick: (ex: Exercise) => void;
  onClose: () => void;
  onVoice: () => void;
  alreadyAdded: string[];
}) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

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
    <div className="safe-top fixed inset-0 z-40 flex flex-col bg-bg">
      <div className="flex items-center gap-2 border-b border-[color:var(--divider)] p-3">
        <div className="relative flex-1">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercise or muscle…"
            className="w-full rounded-full border border-[color:var(--divider)] bg-surface py-3 pl-4 pr-12 text-ink placeholder:text-[color:var(--muted)]"
          />
          {isVoiceSupported() && (
            <button
              onClick={onVoice}
              aria-label="Log by voice"
              className="absolute right-1 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full text-[18px]"
            >
              🎤
            </button>
          )}
        </div>
        <button onClick={onClose} className="shrink-0 px-3 py-3 text-[14px] text-[color:var(--muted)]">
          Cancel
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto p-3">
        {results.length === 0 && (
          <li className="p-6 text-center text-[14px] text-[color:var(--muted)]">
            No matches — your gym may call it something else.
          </li>
        )}
        {results.map((e) => (
          <li key={e.id} className="mb-1.5">
            <button
              onClick={() => onPick(e)}
              disabled={alreadyAdded.includes(e.id)}
              className="flex w-full items-center justify-between gap-3 rounded-full bg-surface px-[18px] py-3 text-left disabled:opacity-40"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px]">{e.name}</span>
                <span className="block truncate text-[11px] text-[color:var(--muted)]">
                  {e.primary.map((m) => MUSCLE_LABELS[m]).join(' · ')}
                </span>
              </span>
              <Tag tone="neutral">{e.equipment}</Tag>
            </button>
          </li>
        ))}
        <li className="mt-2">
          <SecondaryButton onClick={() => setCreating(true)} className="w-full border-dashed">
            + Add {query.trim() ? `“${query.trim()}”` : 'a machine from your gym'}
          </SecondaryButton>
        </li>
      </ul>

      {creating && (
        <CustomExerciseForm
          store={store}
          initialName={query.trim()}
          onCreated={(ex) => {
            setCreating(false);
            onPick(ex);
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

/** Shortcuts out to the gym's own booking page and door unlock. */
function GymAccess({ bookUrl, doorUrl }: { bookUrl?: string; doorUrl?: string }) {
  const btn =
    'font-display flex-1 rounded-full py-3 text-center text-[14px] ';
  return (
    <div className="flex gap-2">
      <a
        href={bookUrl ?? DEFAULT_BOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={btn + 'border-[1.5px] border-accent text-accent-700 dark:text-accent-300'}
      >
        Book a slot
      </a>
      {doorUrl ? (
        <a href={doorUrl} className={btn + 'bg-accent text-bg'}>
          Open door
        </a>
      ) : (
        <span className={btn + 'border border-dashed border-[color:var(--dashed)] text-[color:var(--muted)]'}>
          Set door link in You
        </span>
      )}
    </div>
  );
}
