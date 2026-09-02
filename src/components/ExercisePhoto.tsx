import { useRef, useState } from 'react';
import { useExercisePhoto } from '../hooks/useExercisePhoto';

/**
 * A photo of the machine for this exercise — which one it was, and where you
 * set the pin. Saved on the device only, one photo per exercise, replaced when
 * you take a new one.
 */
export function ExercisePhoto({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const { url, busy, error, save, remove } = useExercisePhoto(exerciseId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void save(f);
          e.target.value = '';
        }}
      />

      {url ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomed(true)}
            className="shrink-0 overflow-hidden rounded-md border border-edge"
            aria-label={`View machine photo for ${exerciseName}`}
          >
            <img src={url} alt={`Machine used for ${exerciseName}`} className="h-14 w-14 object-cover" />
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-md border border-edge px-2 py-1 text-xs text-slate-300"
            >
              Retake
            </button>
            <button
              onClick={() => void remove()}
              className="rounded-md border border-edge px-2 py-1 text-xs text-slate-500"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full rounded-md border border-dashed border-edge px-2 py-2 text-xs text-slate-400 disabled:opacity-50"
        >
          {busy ? 'Saving photo…' : '📷 Add a photo of the machine'}
        </button>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {zoomed && url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomed(false)}
          role="presentation"
        >
          <img src={url} alt={`Machine used for ${exerciseName}`} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
