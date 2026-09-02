import { useRef, useState } from 'react';
import type { Store } from '../hooks/useSessions';
import { clearPhotos } from '../lib/photos';
import { parseData } from '../lib/storage';
import type { Unit } from '../types';

export function SettingsTab({ store }: { store: Store }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], {
      type: 'application/json',
    });
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
    <div className="space-y-3 pb-4">
      <Section title="Units">
        <div className="flex rounded-lg border border-edge bg-ink/60 p-1">
          {(['kg', 'lb'] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => store.setUnit(u)}
              className={`flex-1 rounded-md py-2 text-sm font-medium uppercase ${
                store.data.settings.unit === u
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-400'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Weights are stored in kilograms and converted for display, so switching
          units never changes your history.
        </p>
      </Section>

      <Section title="Your data">
        <p className="mb-3 text-xs text-slate-500">
          Everything is stored on this device only — nothing is uploaded. Clearing
          your browser data will erase it, so export a backup now and then.
          Machine photos are kept separately on the device and are not part of
          the JSON backup.
        </p>
        <div className="space-y-2">
          <button
            onClick={exportJson}
            className="w-full rounded-lg border border-edge bg-ink/60 py-2.5 text-sm text-slate-200"
          >
            Export backup (JSON)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-lg border border-edge bg-ink/60 py-2.5 text-sm text-slate-200"
          >
            Import backup
          </button>
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
              if (confirm('Erase all sessions, settings and machine photos? This cannot be undone.')) {
                store.clearAll();
                void clearPhotos();
                setMessage('All data cleared.');
              }
            }}
            className="w-full rounded-lg border border-red-900 py-2.5 text-sm text-red-400"
          >
            Clear all data
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
      </Section>

      <Section title="About the rest recommendations">
        <p className="text-xs leading-relaxed text-slate-400">
          Rest times come from general training heuristics: larger muscle groups and
          heavier compound work take longer to recover than small isolation work, and
          a harder session extends the recommendation. Sleep, nutrition, stress and
          training experience all shift these numbers, so treat them as a starting
          point rather than a rule — and not as medical advice.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-edge bg-panel p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}
