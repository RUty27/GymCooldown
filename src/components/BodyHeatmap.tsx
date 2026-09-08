import { useMemo, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { Store } from '../hooks/useSessions';
import {
  recoveryColor,
  recoveryLabel,
  recoveryLegend,
  volumeColor,
  volumeLegend,
  type HeatmapMode,
  type Theme,
} from '../lib/palette';
import { formatRestRemaining, muscleStatus, type MuscleStatus } from '../lib/recovery';
import { MUSCLE_GROUPS, MUSCLE_LABELS, type MuscleGroup } from '../types';
import { BodyBack, BodyFront } from './BodySvg';
import { MuscleDetailSheet } from './MuscleDetailSheet';
import { Segmented } from './ui';

export function BodyHeatmap({
  store,
  theme,
  onLogExercise,
}: {
  store: Store;
  theme: Theme;
  onLogExercise: (exerciseId: string) => void;
}) {
  const wide = useMediaQuery('(min-width: 1024px)');
  const [mode, setMode] = useState<HeatmapMode>('recovery');
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [selected, setSelected] = useState<MuscleGroup | null>(null);
  const [sheetFor, setSheetFor] = useState<MuscleGroup | null>(null);

  const statuses = useMemo(() => {
    const now = Date.now();
    const map = {} as Record<MuscleGroup, MuscleStatus>;
    for (const m of MUSCLE_GROUPS) map[m] = muscleStatus(m, store.data.sessions, store.lookup, now);
    return map;
  }, [store.data.sessions, store.lookup]);

  const scaleMax = useMemo(
    () => Math.max(0, ...MUSCLE_GROUPS.map((m) => statuses[m].weeklyVolume)),
    [statuses],
  );

  const fillFor = (m: MuscleGroup) =>
    mode === 'recovery'
      ? recoveryColor(statuses[m], theme)
      : volumeColor(statuses[m].weeklyVolume, scaleMax, theme);

  const legend = mode === 'recovery' ? recoveryLegend(theme) : volumeLegend(theme);
  const resting = MUSCLE_GROUPS.filter((m) => statuses[m].state === 'recovering');
  const ready = MUSCLE_GROUPS.length - resting.length;

  // Most rest needed first — the muscles you must not train today.
  const sorted = [...MUSCLE_GROUPS].sort(
    (a, b) => statuses[a].recoveryPct - statuses[b].recoveryPct,
  );

  // Tapping a region both highlights its card and opens the detail sheet, as it
  // did before the redesign.
  const selectMuscle = (m: MuscleGroup) => {
    setSelected(m);
    setSheetFor(m);
  };

  const bodyProps = { fillFor, onSelect: selectMuscle, selected, theme };
  const Figure = side === 'front' ? BodyFront : BodyBack;

  return (
    <div className="px-4 pb-4 lg:px-[30px] lg:pb-7">
      <header className="px-1 pb-3 pt-[18px] lg:pt-7">
        <h1 className="font-display text-[24px]">Body</h1>
        <p className="text-[12px] text-[color:var(--muted)]">
          {resting.length} muscle{resting.length === 1 ? '' : 's'} still resting · {ready} ready
        </p>
      </header>

      <Segmented
        ariaLabel="Heatmap mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'recovery', label: 'Recovery' },
          { value: 'volume', label: 'Volume' },
        ]}
      />

      <div className="relative mt-3 rounded-card bg-surface p-4">
        {/* Wide screens show both figures at once; phones toggle between them.
            Only the layout in use is mounted, so there is one figure in the DOM. */}
        {wide ? (
          <div className="grid grid-cols-2 gap-4">
            <FigurePane label="Front">
              <BodyFront {...bodyProps} />
            </FigurePane>
            <FigurePane label="Back">
              <BodyBack {...bodyProps} />
            </FigurePane>
          </div>
        ) : (
          <>
            <div className="mx-auto h-[min(58vh,520px)]">
              <Figure {...bodyProps} />
            </div>
            <div className="mt-2 flex justify-center">
              <div className="flex gap-1 rounded-full bg-bg p-1 shadow-md">
                {(['front', 'back'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    aria-pressed={side === s}
                    className={`rounded-full px-[22px] py-2 text-[14px] capitalize transition-colors duration-100 ${
                      side === s ? 'font-display bg-ink text-bg' : 'text-[color:var(--muted)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="absolute right-4 top-4 rounded-[20px] bg-bg px-3 py-[10px] shadow-sm">
          <ul className="flex flex-col gap-1.5">
            {legend.map((e) => (
              <li key={e.label} className="flex items-center gap-2 text-[11px]">
                <span
                  className="inline-block h-[11px] w-[11px] rounded-full"
                  style={{ backgroundColor: e.color }}
                />
                {e.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 px-1 text-[11px] uppercase tracking-[.1em] text-[color:var(--muted)]">
        {mode === 'recovery' ? 'Sorted by rest remaining' : 'Volume load, last 7 days'}
      </p>

      {mode === 'recovery' ? (
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-2">
          {sorted.map((m) => (
            <MuscleCard
              key={m}
              muscle={m}
              status={statuses[m]}
              theme={theme}
              selected={selected === m}
              onClick={() => {
                setSelected(m);
                setSheetFor(m);
              }}
            />
          ))}
        </div>
      ) : (
        <table className="mt-2 w-full">
          <thead>
            <tr className="border-b border-[color:var(--divider)]">
              <th className="eyebrow py-1.5 text-left font-normal">Muscle</th>
              <th className="eyebrow py-1.5 text-right font-normal">Volume</th>
            </tr>
          </thead>
          <tbody>
            {[...MUSCLE_GROUPS]
              .sort((a, b) => statuses[b].weeklyVolume - statuses[a].weeklyVolume)
              .map((m) => (
                <tr key={m} className="border-b border-[color:var(--row-line)] last:border-0">
                  <td className="py-2 text-[14px]">{MUSCLE_LABELS[m]}</td>
                  <td className="py-2 text-right text-[14px] tabular-nums text-[color:var(--muted)]">
                    {Math.round(statuses[m].weeklyVolume).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {sheetFor && (
        <MuscleDetailSheet
          muscle={sheetFor}
          status={statuses[sheetFor]}
          store={store}
          theme={theme}
          onLogExercise={(id) => {
            setSheetFor(null);
            onLogExercise(id);
          }}
          onClose={() => setSheetFor(null)}
        />
      )}
    </div>
  );
}

function FigurePane({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-1 text-center">{label}</p>
      <div className="h-[400px]">{children}</div>
    </div>
  );
}

function MuscleCard({
  muscle,
  status,
  theme,
  selected,
  onClick,
}: {
  muscle: MuscleGroup;
  status: MuscleStatus;
  theme: Theme;
  selected: boolean;
  onClick: () => void;
}) {
  const color = recoveryColor(status, theme);
  return (
    <button
      onClick={onClick}
      aria-label={`${MUSCLE_LABELS[muscle]} — ${recoveryLabel(status)}, ${formatRestRemaining(status)}`}
      className={`w-[150px] shrink-0 rounded-inner bg-surface p-[14px] text-left transition-colors duration-100 ${
        selected ? 'border-[1.5px] border-accent-600' : 'border-[1.5px] border-transparent'
      }`}
    >
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-[10px] w-[10px] rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] text-accent-700 dark:text-accent-300">
          {recoveryLabel(status)}
        </span>
      </span>
      <span className="font-display mt-1 block truncate text-[19px]">{MUSCLE_LABELS[muscle]}</span>
      <span className="block text-[12px] text-[color:var(--muted)]">
        {formatRestRemaining(status)}
      </span>
      <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-bg">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${Math.round(status.recoveryPct * 100)}%`,
            backgroundColor: color,
          }}
        />
      </span>
    </button>
  );
}
