import { useCallback, useEffect, useState } from 'react';
import { BodyHeatmap } from './components/BodyHeatmap';
import { History } from './components/History';
import { LogWorkout } from './components/LogWorkout';
import { SettingsTab } from './components/Settings';
import { useSessions } from './hooks/useSessions';
import type { LoggedExercise } from './types';

const TABS = [
  { id: 'log', label: 'Log', icon: '📝' },
  { id: 'body', label: 'Body', icon: '🧍' },
  { id: 'history', label: 'History', icon: '📅' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const [tab, setTab] = useState<TabId>('log');
  const store = useSessions();

  // The in-progress workout lives here rather than inside the Log tab, because
  // that tab unmounts when you switch away — mid-session you can check the Body
  // tab for what is recovered, or log from a sore muscle, without losing it.
  const [draft, setDraft] = useState<LoggedExercise[]>([]);
  const [notes, setNotes] = useState('');
  // null means "stamp it when I finish"; a value means a deliberately chosen date.
  const [workoutDate, setWorkoutDate] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Tapping an exercise on a muscle's detail sheet drops it into today's
  // workout and takes you to the Log tab to fill in the sets.
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

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col">
      <header className="sticky top-0 z-30 border-b border-edge bg-ink/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold tracking-tight">
          Gym<span className="text-sky-400">Cooldown</span>
        </h1>
        <p className="text-xs text-slate-500">{TABS.find((t) => t.id === tab)?.label}</p>
      </header>

      <main className="flex-1 px-3 pt-3">
        {tab === 'log' && (
          <LogWorkout
            store={store}
            workout={{ draft, setDraft, notes, setNotes, workoutDate, setWorkoutDate, highlightId }}
          />
        )}
        {tab === 'body' && <BodyHeatmap store={store} onLogExercise={logExercise} />}
        {tab === 'history' && <History store={store} />}
        {tab === 'settings' && <SettingsTab store={store} />}
      </main>

      <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-edge bg-panel pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
              tab === t.id ? 'text-sky-400' : 'text-slate-500'
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
            {t.id === 'log' && draft.length > 0 && (
              <span className="sr-only">{draft.length} exercises in progress</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
