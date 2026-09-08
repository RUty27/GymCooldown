import { useMemo } from 'react';
import type { Store } from '../hooks/useSessions';
import { recoveryColor, recoveryLabel, type Theme } from '../lib/palette';
import { formatRestRemaining, formatSinceLast, type MuscleStatus } from '../lib/recovery';
import { setsInWindow } from '../lib/volume';
import { MUSCLE_LABELS, type MuscleGroup } from '../types';
import { SecondaryButton, Sheet, Tag } from './ui';

export function MuscleDetailSheet({
  muscle,
  status,
  store,
  theme,
  onLogExercise,
  onClose,
}: {
  muscle: MuscleGroup;
  status: MuscleStatus;
  store: Store;
  theme: Theme;
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
    <Sheet onClose={onClose} ariaLabel={`${MUSCLE_LABELS[muscle]} detail`}>
      <>
        <div className="mb-3 flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-full"
            style={{ backgroundColor: recoveryColor(status, theme) }}
          />
          <h2 className="font-display text-[20px]">{MUSCLE_LABELS[muscle]}</h2>
          <span className="ml-auto text-[13px] text-[color:var(--muted)]">{recoveryLabel(status)}</span>
        </div>

        <div className="mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round(status.recoveryPct * 100)}%`,
                backgroundColor: recoveryColor(status, theme),
              }}
            />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <p className="text-[13px]">{formatRestRemaining(status)}</p>
            <p className="text-[12px] tabular-nums text-[color:var(--muted)]">
              {Math.round(status.recoveryPct * 100)}% recovered
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2.5">
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
            <h3 className="eyebrow mb-1">
              Last hit by
            </h3>
            <p className="text-[14px]">{lastExercises.join(', ')}</p>
          </section>
        )}

        <section className="mt-4">
          <h3 className="eyebrow">
            Sore from what? Log it
          </h3>
          <p className="mb-2 mt-0.5 text-[12px] text-[color:var(--muted)]">
            Tap what you did and it goes straight into today's workout.
          </p>

          <div className="space-y-1">
            {trains.direct.map((ex) => (
              <ExerciseButton key={ex.id} name={ex.name} equipment={ex.equipment} onClick={() => onLogExercise(ex.id)} />
            ))}
          </div>

          {trains.indirect.length > 0 && (
            <details className="mt-2 rounded-inner border border-[color:var(--divider)]">
              <summary className="cursor-pointer px-3 py-3 text-[12px] text-[color:var(--muted)]">
                Also works it indirectly ({trains.indirect.length})
              </summary>
              <div className="space-y-1.5 border-t border-[color:var(--divider)] p-2">
                {trains.indirect.map((ex) => (
                  <ExerciseButton key={ex.id} name={ex.name} equipment={ex.equipment} onClick={() => onLogExercise(ex.id)} />
                ))}
              </div>
            </details>
          )}
        </section>

        <SecondaryButton onClick={onClose} className="mt-5 w-full">
          Close
        </SecondaryButton>
      </>
    </Sheet>
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
      className="flex w-full items-center justify-between gap-3 rounded-full bg-bg px-4 py-3 text-left"
    >
      <span className="min-w-0 truncate text-[14px]">{name}</span>
      <Tag tone="neutral">{equipment}</Tag>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-inner bg-bg p-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="font-display mt-0.5 text-[22px] tabular-nums">{value}</dd>
    </div>
  );
}
