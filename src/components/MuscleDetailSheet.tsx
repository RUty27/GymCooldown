import { useMemo } from 'react';
import type { Store } from '../hooks/useSessions';
import { recoveryColor, recoveryLabel } from '../lib/palette';
import { formatRestRemaining, formatSinceLast, type MuscleStatus } from '../lib/recovery';
import { setsInWindow } from '../lib/volume';
import { MUSCLE_LABELS, type MuscleGroup } from '../types';

export function MuscleDetailSheet({
  muscle,
  status,
  store,
  onLogExercise,
  onClose,
}: {
  muscle: MuscleGroup;
  status: MuscleStatus;
  store: Store;
  onLogExercise: (exerciseId: string) => void;
  onClose: () => void;
}) {
  const weeklySets = setsInWindow(store.data.sessions, store.lookup, muscle, 7);

  const lastSession = status.lastSessionId
    ? store.data.sessions.find((s) => s.id === status.lastSessionId)
    : undefined;

  const lastExercises = lastSession
    ? lastSession.exercises
        .map((le) => store.lookup(le.exerciseId))
        .filter(
          (ex): ex is NonNullable<typeof ex> =>
            !!ex && (ex.primary.includes(muscle) || ex.secondary.includes(muscle)),
        )
        .map((ex) => ex.name)
    : [];

  // Everything that trains this muscle, split by how directly it hits it.
  const trains = useMemo(
    () => ({
      direct: store.exercises.filter((e) => e.primary.includes(muscle)),
      indirect: store.exercises.filter((e) => e.secondary.includes(muscle)),
    }),
    [store.exercises, muscle],
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border-t border-edge bg-panel p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${MUSCLE_LABELS[muscle]} detail`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-600" />

        <div className="mb-3 flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-sm border border-edge"
            style={{ backgroundColor: recoveryColor(status) }}
          />
          <h2 className="text-lg font-semibold">{MUSCLE_LABELS[muscle]}</h2>
          <span className="ml-auto text-sm text-slate-400">{recoveryLabel(status)}</span>
        </div>

        <div className="mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full border border-edge bg-ink">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round(status.recoveryPct * 100)}%`,
                backgroundColor: recoveryColor(status),
              }}
            />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <p className="text-sm text-slate-300">{formatRestRemaining(status)}</p>
            <p className="text-xs tabular-nums text-slate-500">
              {Math.round(status.recoveryPct * 100)}% recovered
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Last trained" value={formatSinceLast(status)} />
          <Stat
            label="Rest recommended"
            value={status.hoursNeeded ? `${status.hoursNeeded}h` : '—'}
          />
          <Stat label="Sets this week" value={String(weeklySets)} />
          <Stat
            label="Volume this week"
            value={Math.round(status.weeklyVolume).toLocaleString()}
          />
        </dl>

        {lastExercises.length > 0 && (
          <section className="mt-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Last hit by
            </h3>
            <p className="text-sm text-slate-300">{lastExercises.join(', ')}</p>
          </section>
        )}

        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sore from what? Log it
          </h3>
          <p className="mb-2 mt-0.5 text-xs text-slate-500">
            Tap what you did and it goes straight into today's workout.
          </p>

          <div className="space-y-1">
            {trains.direct.map((ex) => (
              <ExerciseButton key={ex.id} name={ex.name} equipment={ex.equipment} onClick={() => onLogExercise(ex.id)} />
            ))}
          </div>

          {trains.indirect.length > 0 && (
            <details className="mt-2 rounded-lg border border-edge">
              <summary className="cursor-pointer px-3 py-2 text-xs text-slate-400">
                Also works it indirectly ({trains.indirect.length})
              </summary>
              <div className="space-y-1 border-t border-edge p-2">
                {trains.indirect.map((ex) => (
                  <ExerciseButton key={ex.id} name={ex.name} equipment={ex.equipment} onClick={() => onLogExercise(ex.id)} />
                ))}
              </div>
            </details>
          )}
        </section>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-edge py-2.5 font-medium text-slate-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ExerciseButton({
  name,
  equipment,
  onClick,
}: {
  name: string;
  equipment: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-edge bg-ink/60 px-3 py-2.5 text-left active:bg-slate-700"
    >
      <span className="min-w-0 truncate text-sm text-slate-100">{name}</span>
      <span className="shrink-0 rounded-full border border-edge px-2 py-0.5 text-[10px] uppercase text-slate-500">
        {equipment}
      </span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-edge bg-ink/50 p-2.5">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums text-slate-100">{value}</dd>
    </div>
  );
}
