import { useCallback, useEffect, useRef, useState } from 'react';
import type { Store } from '../hooks/useSessions';
import { parseWorkoutSpeech, type ParseResult } from '../lib/voice';
import { formatWeight } from '../lib/units';
import type { LoggedExercise } from '../types';

/** The Web Speech API is still vendor-prefixed in Safari. */
type SpeechCtor = new () => any;
function speechRecognition(): SpeechCtor | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechCtor | null;
}

export const isVoiceSupported = () => speechRecognition() !== null;

export function VoiceLogger({
  store,
  onApply,
  onClose,
}: {
  store: Store;
  onApply: (entries: LoggedExercise[]) => void;
  onClose: () => void;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = speechRecognition();
    if (!Ctor) return;
    setError(null);
    setResult(null);
    setTranscript('');

    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = navigator.language || 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    let finalText = '';
    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk + ' ';
        else interim += chunk;
      }
      setTranscript((finalText + interim).trim());
    };
    rec.onerror = (event: any) => {
      setError(
        event.error === 'not-allowed'
          ? 'Microphone access was blocked. Allow it in your browser settings to log by voice.'
          : `Speech recognition failed (${event.error}).`,
      );
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      const text = finalText.trim();
      if (text) {
        setTranscript(text);
        setResult(parseWorkoutSpeech(text, store.exercises, store.data.settings.unit));
      }
    };

    rec.start();
    setListening(true);
  }, [store.exercises, store.data.settings.unit]);

  useEffect(
    () => () => {
      try {
        recRef.current?.abort();
      } catch {
        /* nothing to abort */
      }
    },
    [],
  );

  const apply = () => {
    if (!result) return;
    onApply(result.entries.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets })));
  };

  const unit = store.data.settings.unit;

  return (
    <div className="safe-top fixed inset-0 z-50 flex flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-[color:var(--divider)] p-3">
        <h2 className="font-semibold">Log by voice</h2>
        <button onClick={onClose} className="px-2 py-1 text-sm text-[color:var(--muted)]">
          Cancel
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-[color:var(--muted)]">
          Say what you did, for example:
        </p>
        <p className="mt-1 rounded-panel bg-surface p-4 text-[14px] italic">
          “Bench press 3 sets of 10 at 60 kilos, then lat pulldown 3 of 12 at 50”
        </p>

        {transcript && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Heard</h3>
            <p className="mt-1 text-sm text-ink">{transcript}</p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-panel border border-accent-700 bg-accent-100 p-3 text-[13px] text-accent-700 dark:bg-accent-900 dark:text-accent-300">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
              Check this before saving
            </h3>

            {result.entries.length === 0 && (
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Nothing recognisable yet — try naming the exercise, then the sets, reps and weight.
              </p>
            )}

            <ul className="mt-2 space-y-2">
              {result.entries.map((e, i) => (
                <li key={i} className="rounded-inner bg-surface p-4">
                  <p className="font-medium text-ink">{e.exerciseName}</p>
                  <p className="mt-0.5 text-sm tabular-nums text-ink">
                    {e.sets.length} × {e.sets[0].reps} @ {formatWeight(e.sets[0].weight, unit)}
                  </p>
                  <p className="mt-1 text-xs italic text-[color:var(--muted)]">“{e.heard}”</p>
                </li>
              ))}
            </ul>

            {result.unmatched.length > 0 && (
              <p className="mt-2 text-xs text-accent-700 dark:text-accent-300">
                Not understood: {result.unmatched.map((u) => `“${u}”`).join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-[color:var(--divider)] p-4 pb-8">
        <button
          onClick={listening ? stop : start}
          className={`w-full rounded-full py-3 font-semibold ${
            listening ? 'bg-accent-700 text-bg' : 'bg-accent text-bg'
          }`}
        >
          {listening ? '⏹ Stop and read it back' : '🎤 Start speaking'}
        </button>

        {result && result.entries.length > 0 && (
          <button
            onClick={apply}
            className="w-full rounded-full bg-accent py-3 font-semibold text-bg"
          >
            Add {result.entries.length} exercise{result.entries.length === 1 ? '' : 's'} to workout
          </button>
        )}

        <p className="text-center text-[11px] leading-relaxed text-[color:var(--muted)]">
          Your browser does the transcription. On Chrome that means the audio is sent to Google's
          speech service; nothing is sent anywhere by this app.
        </p>
      </div>
    </div>
  );
}
