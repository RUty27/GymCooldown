import { useCallback, useEffect, useState } from 'react';
import { BodyHeatmap } from './components/BodyHeatmap';
import { History } from './components/History';
import { LogWorkout } from './components/LogWorkout';
import { SettingsTab } from './components/Settings';
import { useResolvedTheme } from './hooks/useResolvedTheme';
import { useSessions } from './hooks/useSessions';
import { toDisplay } from './lib/units';
import { exerciseTonnage } from './lib/volume';
import type { LoggedExercise } from './types';

const TABS = [
  { id: 'log', label: 'Log' },
  { id: 'body', label: 'Body' },
  { id: 'history', label: 'History' },
  { id: 'you', label: 'You' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const [tab, setTab] = useState<TabId>('log');
  const store = useSessions();
  const theme = useResolvedTheme(store.data.settings.theme);

  // The in-progress workout lives here rather than inside the Log tab, because
  // that tab unmounts when you switch away — mid-session you can check the Body
  // tab for what is recovered, or log from a sore muscle, without losing it.
  const [draft, setDraft] = useState<LoggedExercise[]>([]);
  const [notes, setNotes] = useState('');
  const [workoutDate, setWorkoutDate] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const logExercise = useCallback((exerciseId: string) => {
    setDraft((d) =>
      d.some((x) => x.exerciseId === exerciseId) ? d : [...d, { exerciseId, sets: [] }],
    );
    setHighlightId(exerciseId);
    setTab('log');
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 3000);
    return () => clearTimeout(t);
  }, [highlightId]);

  const workout = { draft, setDraft, notes, setNotes, workoutDate, setWorkoutDate, highlightId };

  const screens = {
    log: <LogWorkout store={store} workout={workout} />,
    body: <BodyHeatmap store={store} theme={theme} onLogExercise={logExercise} />,
    history: <History store={store} />,
    you: <SettingsTab store={store} />,
  };

  return (
    // One column on a phone (main, then the nav); a row on desktop (rail, then
    // main). The screen tree is instantiated once either way — rendering two
    // shells would duplicate every component's state and DOM.
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="safe-top hidden w-[210px] flex-none flex-col bg-surface px-[18px] py-6 lg:flex">
        <h1 className="font-display mb-6 text-[22px]">
          Gym<span className="text-accent-700 dark:text-accent-300">Cooldown</span>
        </h1>
        <div className="flex flex-col gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`rounded-full px-[18px] py-[10px] text-left text-[15px] transition-colors duration-100 ${
                tab === t.id
                  ? 'font-display bg-accent text-bg'
                  : 'text-[color:var(--muted)] hover:bg-[color:var(--row-line)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <WeekCard store={store} />
      </aside>

      <main className="safe-top mx-auto w-full max-w-lg flex-1 lg:max-w-[1200px]">{screens[tab]}</main>

      <nav className="safe-bottom-nav sticky bottom-0 z-30 bg-surface px-3 pt-[10px] lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`rounded-full py-[9px] text-[13px] transition-colors duration-100 ${
                tab === t.id ? 'font-display bg-accent text-bg' : 'text-[color:var(--muted)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Pinned to the bottom of the desktop rail. */
function WeekCard({ store }: { store: ReturnType<typeof useSessions> }) {
  const unit = store.data.settings.unit;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = store.data.sessions.filter((s) => {
    const t = Date.parse(s.date);
    return !Number.isNaN(t) && t >= weekAgo;
  });
  const tonnage = recent.reduce(
    (n, s) => n + s.exercises.reduce((m, e) => m + exerciseTonnage(e.sets), 0),
    0,
  );

  return (
    <div className="mt-auto rounded-panel bg-bg p-4">
      <p className="eyebrow">This week</p>
      <p className="font-display mt-1 text-[28px] text-accent-600 dark:text-accent-400">
        {Math.round(toDisplay(tonnage, unit)).toLocaleString()}
      </p>
      <p className="text-[12px] text-[color:var(--muted)]">
        {unit} across {recent.length} session{recent.length === 1 ? '' : 's'}
      </p>
    </div>
  );
}
