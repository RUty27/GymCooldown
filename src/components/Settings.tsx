import { useRef, useState } from 'react';
import type { Store } from '../hooks/useSessions';
import { clearPhotos } from '../lib/photos';
import { parseData } from '../lib/storage';
import { CustomExerciseForm } from './CustomExerciseForm';
import { Card, SecondaryButton, Segmented } from './ui';
import { MUSCLE_LABELS, type ThemePreference, type Unit } from '../types';

export function SettingsTab({ store }: { store: Store }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymcooldown-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    const text = await file.text();
    const data = parseData(text);
    if (data.sessions.length === 0 && text.length > 40) {
      setMessage('That file did not contain any readable sessions.');
      return;
    }
    store.replaceAll(data);
    setMessage(`Imported ${data.sessions.length} session(s).`);
  };

  return (
    <div className="max-w-2xl px-4 pb-4 lg:px-[30px] lg:pb-7">
      <header className="px-1 pb-3 pt-[18px] lg:pt-7">
        <h1 className="font-display text-[24px]">You</h1>
        <p className="text-[12px] text-[color:var(--muted)]">Units, theme, exercises and backup</p>
      </header>

      <div className="flex flex-col gap-3">
        <Card>
          <h2 className="font-display mb-2 text-[17px]">Units</h2>
          <Segmented<Unit>
            ariaLabel="Weight units"
            value={store.data.settings.unit}
            onChange={store.setUnit}
            options={[
              { value: 'kg', label: 'KG' },
              { value: 'lb', label: 'LB' },
            ]}
          />
          <p className="mt-2 text-[12px] text-[color:var(--muted)]">
            Weights are stored in kilograms and converted for display, so switching units never
            changes your history.
          </p>
        </Card>

        <Card>
          <h2 className="font-display mb-2 text-[17px]">Theme</h2>
          <Segmented<ThemePreference>
            ariaLabel="Theme"
            value={store.data.settings.theme}
            onChange={store.setTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Card>

        <Card>
          <h2 className="font-display mb-2 text-[17px]">
            Your own exercises ({store.data.customExercises.length})
          </h2>
          {store.data.customExercises.length === 0 ? (
            <p className="text-[12px] text-[color:var(--muted)]">
              None yet. When a machine at your gym is not in the list, add it from the search
              screen on the Log tab.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {store.data.customExercises.map((ex) => {
                const used = store.sessionsUsing(ex.id);
                return (
                  <li
                    key={ex.id}
                    className="flex items-center justify-between gap-2 rounded-full bg-bg py-2 pl-[18px] pr-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px]">{ex.name}</span>
                      <span className="block truncate text-[11px] text-[color:var(--muted)]">
                        {ex.primary.map((m) => MUSCLE_LABELS[m]).join(' · ')}
                        {used > 0 && ` · used in ${used} session${used === 1 ? '' : 's'}`}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        const warning =
                          used > 0
                            ? `Delete "${ex.name}"? ${used} saved session${used === 1 ? '' : 's'} use it, and those entries will no longer count towards your muscle tracking.`
                            : `Delete "${ex.name}"?`;
                        if (confirm(warning)) store.deleteCustomExercise(ex.id);
                      }}
                      className="h-11 shrink-0 px-2 text-[12px] text-accent-700 dark:text-accent-300"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <SecondaryButton onClick={() => setCreating(true)} className="mt-3 w-full">
            + Add a machine from your gym
          </SecondaryButton>
        </Card>

        <Card>
          <h2 className="font-display mb-2 text-[17px]">Backup</h2>
          <p className="mb-3 text-[12px] text-[color:var(--muted)]">
            Everything is stored on this device only — nothing is uploaded. Clearing your browser
            data will erase it, so export a backup now and then. Machine photos are kept separately
            on the device and are not part of the JSON backup.
          </p>
          <div className="flex flex-col gap-2">
            <SecondaryButton onClick={exportJson} className="w-full">
              Export backup (JSON)
            </SecondaryButton>
            <SecondaryButton onClick={() => fileRef.current?.click()} className="w-full">
              Import backup
            </SecondaryButton>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importJson(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => {
                if (
                  confirm('Erase all sessions, settings and machine photos? This cannot be undone.')
                ) {
                  store.clearAll();
                  void clearPhotos();
                  setMessage('All data cleared.');
                }
              }}
              className="font-display w-full rounded-full border border-accent-700 py-3 text-[15px] text-accent-700 dark:border-accent-300 dark:text-accent-300"
            >
              Clear all data
            </button>
          </div>
          {message && <p className="mt-3 text-[12px] text-accent-700 dark:text-accent-300">{message}</p>}
        </Card>

        <Card>
          <h2 className="font-display mb-2 text-[17px]">About the rest recommendations</h2>
          <p className="text-[12px] leading-relaxed text-[color:var(--muted)]">
            Rest times come from general training heuristics: larger muscle groups and heavier
            compound work take longer to recover than small isolation work, and a harder session
            extends the recommendation. Sleep, nutrition, stress and training experience all shift
            these numbers, so treat them as a starting point rather than a rule — and not as
            medical advice.
          </p>
        </Card>
      </div>

      {creating && (
        <CustomExerciseForm
          store={store}
          onCreated={() => setCreating(false)}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
