import { useState } from 'react';
import type { Store } from '../hooks/useSessions';
import { formatWeight, toDisplay } from '../lib/units';
import { exerciseTonnage, sessionVolumeByMuscle } from '../lib/volume';
import { MUSCLE_LABELS, type MuscleGroup } from '../types';

export function History({ store }: { store: Store }) {
  const [open, setOpen] = useState<string | null>(null);
  const unit = store.data.settings.unit;

  const sessions = [...store.data.sessions].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-edge p-6 text-center">
        <p className="text-sm text-slate-400">
          No sessions yet. Log one on the Log tab and it will show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 pb-4">
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
          <li key={s.id} className="rounded-xl border border-edge bg-panel">
            <button
              onClick={() => setOpen(isOpen ? null : s.id)}
              className="flex w-full items-center justify-between gap-3 p-3 text-left"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-100">
                  {new Date(s.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {top.join(' · ') || 'No muscles matched'}
                </span>
              </span>
              <span className="shrink-0 text-right text-xs text-slate-500">
                <span className="block tabular-nums">{sets} sets</span>
                <span className="block tabular-nums">
                  {Math.round(toDisplay(tonnage, unit)).toLocaleString()} {unit}
                </span>
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-edge p-3">
                <ul className="space-y-2">
                  {s.exercises.map((le, i) => {
                    const ex = store.lookup(le.exerciseId);
                    return (
                      <li key={i}>
                        <p className="text-sm text-slate-200">{ex?.name ?? le.exerciseId}</p>
                        <p className="text-xs tabular-nums text-slate-500">
                          {le.sets
                            .map((set) => `${set.reps} × ${formatWeight(set.weight, unit)}`)
                            .join('  ·  ')}
                        </p>
                      </li>
                    );
                  })}
                </ul>
                {s.notes && <p className="mt-2 text-xs italic text-slate-400">{s.notes}</p>}
                <button
                  onClick={() => {
                    if (confirm('Delete this session? This cannot be undone.')) {
                      store.deleteSession(s.id);
                    }
                  }}
                  className="mt-3 w-full rounded-lg border border-red-900 py-2 text-sm text-red-400"
                >
                  Delete session
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
