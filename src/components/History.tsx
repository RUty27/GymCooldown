import { useState } from 'react';
import type { Store } from '../hooks/useSessions';
import {
  clampToNow,
  describeSessionDate,
  fromLocalInputValue,
  toLocalInputValue,
} from '../lib/datetime';
import { formatWeight, toDisplay } from '../lib/units';
import { exerciseTonnage, sessionVolumeByMuscle } from '../lib/volume';
import { EmptyPanel, SecondaryButton, Tag } from './ui';
import { MUSCLE_LABELS, type MuscleGroup } from '../types';

export function History({ store }: { store: Store }) {
  const [open, setOpen] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const unit = store.data.settings.unit;

  const sessions = [...store.data.sessions].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = sessions.filter((s) => {
    const t = Date.parse(s.date);
    return !Number.isNaN(t) && t >= weekAgo;
  });
  const weekTonnage = thisWeek.reduce(
    (n, s) => n + s.exercises.reduce((m, e) => m + exerciseTonnage(e.sets), 0),
    0,
  );

  return (
    <div className="px-4 pb-4 lg:px-[30px] lg:pb-7">
      <header className="px-1 pb-3 pt-[18px] lg:pt-7">
        <h1 className="font-display text-[24px]">History</h1>
        <p className="text-[12px] text-[color:var(--muted)]">
          {thisWeek.length} session{thisWeek.length === 1 ? '' : 's'} this week ·{' '}
          {Math.round(toDisplay(weekTonnage, unit)).toLocaleString()} {unit} moved
        </p>
      </header>

      {sessions.length === 0 ? (
        <EmptyPanel>No sessions yet. Log one on the Log tab and it will show up here.</EmptyPanel>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {sessions.map((s) => {
            const volume = sessionVolumeByMuscle(s, store.lookup);
            const top = (Object.entries(volume) as [MuscleGroup, number][])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([m]) => MUSCLE_LABELS[m]);
            const tonnage = s.exercises.reduce((n, e) => n + exerciseTonnage(e.sets), 0);
            const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
            const isOpen = open === s.id;

            return (
              <li key={s.id} className="rounded-card bg-surface p-[18px] shadow-sm">
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <span className="min-w-0">
                    <span className={`font-display block ${isOpen ? 'text-[20px]' : 'text-[19px]'}`}>
                      {describeSessionDate(s.date)}
                    </span>
                    {!isOpen && (
                      <span className="block truncate text-[12px] text-[color:var(--muted)]">
                        {top.join(' · ') || 'No muscles matched'}
                      </span>
                    )}
                  </span>
                  <span className="flex-none text-right">
                    <span className="font-display block text-[19px] text-accent-600 dark:text-accent-400">
                      {Math.round(toDisplay(tonnage, unit)).toLocaleString()}
                    </span>
                    <span className="eyebrow block">
                      {unit} · {sets} sets
                    </span>
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {top.map((m, i) => (
                        <Tag key={m} tone={i === 0 ? 'accent' : 'neutral'}>
                          {m}
                        </Tag>
                      ))}
                    </div>

                    <ul className="mt-3 flex flex-col gap-2.5">
                      {s.exercises.map((le, i) => {
                        const ex = store.lookup(le.exerciseId);
                        return (
                          <li key={i}>
                            <p className="text-[14px] font-semibold">{ex?.name ?? le.exerciseId}</p>
                            <p className="text-[12px] tabular-nums text-[color:var(--muted)]">
                              {le.sets
                                .map((set) => `${set.reps} × ${formatWeight(set.weight, unit)}`)
                                .join('  ·  ')}
                            </p>
                          </li>
                        );
                      })}
                    </ul>

                    {s.notes && (
                      <p className="mt-2 text-[13px] italic opacity-60">{s.notes}</p>
                    )}

                    <div className="mt-3 flex gap-2">
                      <SecondaryButton
                        onClick={() => setEditingDate(editingDate === s.id ? null : s.id)}
                        className="flex-1"
                      >
                        Change date
                      </SecondaryButton>
                      <SecondaryButton
                        tone="accent"
                        onClick={() => {
                          if (confirm('Delete this session? This cannot be undone.')) {
                            store.deleteSession(s.id);
                          }
                        }}
                      >
                        Delete
                      </SecondaryButton>
                    </div>

                    {editingDate === s.id && (
                      <SessionDateEditor
                        date={s.date}
                        onChange={(iso) => store.updateSession(s.id, { date: iso })}
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Correct the date of a session already saved — logged a day late, or on the wrong day. */
function SessionDateEditor({
  date,
  onChange,
}: {
  date: string;
  onChange: (iso: string) => void;
}) {
  return (
    <div className="mt-3">
      <label className="eyebrow block" htmlFor={`date-${date}`}>
        Change the date of this workout
      </label>
      <input
        id={`date-${date}`}
        type="datetime-local"
        value={toLocalInputValue(date)}
        max={toLocalInputValue(new Date().toISOString())}
        onChange={(e) => {
          const iso = fromLocalInputValue(e.target.value);
          if (iso) onChange(clampToNow(iso));
        }}
        className="mt-1.5 w-full rounded-full border border-[color:var(--divider)] bg-bg px-4 py-2.5 text-[14px] text-ink"
      />
    </div>
  );
}
