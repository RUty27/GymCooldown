import { useMemo, useState } from 'react';
import { BodyBack, BodyFront } from './BodySvg';
import { MuscleDetailSheet } from './MuscleDetailSheet';
import {
  RECOVERY_LEGEND,
  VOLUME_LEGEND,
  recoveryColor,
  volumeColor,
  type HeatmapMode,
} from '../lib/palette';
import { formatRestRemaining, muscleStatus, type MuscleStatus } from '../lib/recovery';
import type { Store } from '../hooks/useSessions';
import { MUSCLE_GROUPS, MUSCLE_LABELS, type MuscleGroup } from '../types';

export function BodyHeatmap({
  store,
  onLogExercise,
}: {
  store: Store;
  onLogExercise: (exerciseId: string) => void;
}) {
  const [mode, setMode] = useState<HeatmapMode>('recovery');
  const [selected, setSelected] = useState<MuscleGroup | null>(null);

  const statuses = useMemo(() => {
    const now = Date.now();
    const map = {} as Record<MuscleGroup, MuscleStatus>;
    for (const m of MUSCLE_GROUPS) {
      map[m] = muscleStatus(m, store.data.sessions, store.lookup, now);
    }
    return map;
  }, [store.data.sessions, store.lookup]);

  const scaleMax = useMemo(
    () => Math.max(0, ...MUSCLE_GROUPS.map((m) => statuses[m].weeklyVolume)),
    [statuses],
  );

  const fillFor = (m: MuscleGroup) =>
    mode === 'recovery'
      ? recoveryColor(statuses[m])
      : volumeColor(statuses[m].weeklyVolume, scaleMax);

  const legend = mode === 'recovery' ? RECOVERY_LEGEND : VOLUME_LEGEND;

  const recovering = MUSCLE_GROUPS.filter((m) => statuses[m].state === 'recovering');
  const readyBig = MUSCLE_GROUPS.filter((m) => statuses[m].state !== 'recovering');

  const bodyProps = { fillFor, onSelect: setSelected, selected };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex rounded-lg border border-edge bg-panel p-1 text-sm">
        {(['recovery', 'volume'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-3 py-2 font-medium capitalize transition-colors ${
              mode === m ? 'bg-slate-100 text-slate-900' : 'text-slate-400'
            }`}
          >
            {m === 'recovery' ? 'Recovery' : 'Weekly volume'}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-edge bg-panel p-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-center text-xs uppercase tracking-wide text-slate-500">
              Front
            </p>
            <div className="h-[300px]">
              <BodyFront {...bodyProps} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-center text-xs uppercase tracking-wide text-slate-500">
              Back
            </p>
            <div className="h-[300px]">
              <BodyBack {...bodyProps} />
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-slate-500">
          Tap a muscle for detail, or to log what made it sore
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-edge pt-3">
          {legend.map((entry) => (
            <span key={entry.label} className="flex items-center gap-1.5 text-xs text-slate-300">
              <span
                className="inline-block h-3 w-3 rounded-sm border border-edge"
                style={{ backgroundColor: entry.color }}
              />
              {entry.label}
            </span>
          ))}
        </div>
      </div>

      {mode === 'recovery' && (
        <div className="space-y-3">
          <Panel title={`Still resting (${recovering.length})`}>
            {recovering.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nothing is mid-recovery — you are clear to train anything.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {recovering
                  .sort((a, b) => statuses[a].recoveryPct - statuses[b].recoveryPct)
                  .map((m) => (
                    <li key={m} className="flex items-center justify-between gap-2 text-sm">
                      <button
                        className="text-left text-slate-200 underline-offset-2 hover:underline"
                        onClick={() => setSelected(m)}
                      >
                        {MUSCLE_LABELS[m]}
                      </button>
                      <span className="shrink-0 text-xs text-amber-300">
                        {formatRestRemaining(statuses[m])}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>

          <Panel title={`Ready to train (${readyBig.length})`}>
            <div className="flex flex-wrap gap-1.5">
              {readyBig.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelected(m)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    statuses[m].state === 'undertrained'
                      ? 'border-slate-600 bg-slate-700/40 text-slate-300'
                      : 'border-green-700 bg-green-900/40 text-green-300'
                  }`}
                >
                  {MUSCLE_LABELS[m]}
                  {statuses[m].state === 'undertrained' && ' · stale'}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {mode === 'volume' && (
        <Panel title="Volume load, last 7 days">
          <table className="w-full text-sm">
            <tbody>
              {[...MUSCLE_GROUPS]
                .sort((a, b) => statuses[b].weeklyVolume - statuses[a].weeklyVolume)
                .map((m) => (
                  <tr key={m} className="border-b border-edge/60 last:border-0">
                    <td className="py-1.5 text-slate-300">{MUSCLE_LABELS[m]}</td>
                    <td className="py-1.5 text-right tabular-nums text-slate-400">
                      {Math.round(statuses[m].weeklyVolume).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>
      )}

      {selected && (
        <MuscleDetailSheet
          muscle={selected}
          status={statuses[selected]}
          store={store}
          onLogExercise={(id) => {
            setSelected(null);
            onLogExercise(id);
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-edge bg-panel p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}
