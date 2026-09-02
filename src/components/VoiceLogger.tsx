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
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="flex items-center justify-between border-b border-edge p-3">
        <h2 className="font-semibold">Log by voice</h2>
        <button onClick={onClose} className="px-2 py-1 text-sm text-slate-400">
          Cancel
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-slate-400">
          Say what you did, for example:
        </p>
        <p className="mt-1 rounded-lg border border-edge bg-panel p-3 text-sm italic text-slate-300">
          “Bench press 3 sets of 10 at 60 kilos, then lat pulldown 3 of 12 at 50”
        </p>

        {transcript && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Heard</h3>
            <p className="mt-1 text-sm text-slate-200">{transcript}</p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Check this before saving
            </h3>

            {result.entries.length === 0 && (
              <p className="mt-2 text-sm text-slate-400">
                Nothing recognisable yet — try naming the exercise, then the sets, reps and weight.
              </p>
            )}

            <ul className="mt-2 space-y-2">
              {result.entries.map((e, i) => (
                <li key={i} className="rounded-lg border border-edge bg-panel p-3">
                  <p className="font-medium text-slate-100">{e.exerciseName}</p>
                  <p className="mt-0.5 text-sm tabular-nums text-slate-300">
                    {e.sets.length} × {e.sets[0].reps} @ {formatWeight(e.sets[0].weight, unit)}
                  </p>
                  <p className="mt-1 text-xs italic text-slate-500">“{e.heard}”</p>
                </li>
              ))}
            </ul>

            {result.unmatched.length > 0 && (
              <p className="mt-2 text-xs text-amber-300">
                Not understood: {result.unmatched.map((u) => `“${u}”`).join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-edge p-4 pb-8">
        <button
          onClick={listening ? stop : start}
          className={`w-full rounded-lg py-3 font-semibold ${
            listening ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-900'
          }`}
        >
          {listening ? '⏹ Stop and read it back' : '🎤 Start speaking'}
        </button>

        {result && result.entries.length > 0 && (
          <button
            onClick={apply}
            className="w-full rounded-lg bg-sky-500 py-3 font-semibold text-slate-900"
          >
            Add {result.entries.length} exercise{result.entries.length === 1 ? '' : 's'} to workout
          </button>
        )}

        <p className="text-center text-[11px] leading-relaxed text-slate-500">
          Your browser does the transcription. On Chrome that means the audio is sent to Google's
          speech service; nothing is sent anywhere by this app.
        </p>
      </div>
    </div>
  );
}
