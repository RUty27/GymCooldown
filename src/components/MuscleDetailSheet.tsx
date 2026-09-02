import { EXERCISES } from '../data/exercises';
import type { Store } from '../hooks/useSessions';
import { recoveryColor, recoveryLabel } from '../lib/palette';
import { formatRestRemaining, formatSinceLast, type MuscleStatus } from '../lib/recovery';
import { setsInWindow } from '../lib/volume';
import { MUSCLE_LABELS, type MuscleGroup } from '../types';

export function MuscleDetailSheet({
  muscle,
  status,
  store,
  onClose,
}: {
  muscle: MuscleGroup;
  status: MuscleStatus;
  store: Store;
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

  const suggestions = EXERCISES.filter((e) => e.primary.includes(muscle)).slice(0, 4);

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
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Exercises that train this
          </h3>
          <p className="text-sm text-slate-300">{suggestions.map((e) => e.name).join(', ')}</p>
        </section>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-slate-100 py-2.5 font-medium text-slate-900"
        >
          Close
        </button>
      </div>
    </div>
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
