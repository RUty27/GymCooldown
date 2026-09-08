import { useState } from 'react';
import { Sheet } from './ui';

export type PadField = 'reps' | 'weight';

/**
 * Thumb-sized numeric entry, replacing the old ± Stepper whose 32px buttons
 * were the smallest targets in the app. Keys are ~60px tall.
 */
export function NumberPadSheet({
  field,
  unit,
  initial,
  context,
  chips,
  summary,
  onCommit,
  onClose,
}: {
  field: PadField;
  unit: string;
  initial: number;
  /** e.g. "Set 3 · Bench Press" */
  context: string;
  chips: number[];
  /** Renders the confirm label from the pending value, e.g. "Add set · 8 × 82.5 kg". */
  summary: (value: number) => string;
  onCommit: (value: number) => void;
  onClose: () => void;
}) {
  const isReps = field === 'reps';
  const min = isReps ? 1 : 0;
  const [text, setText] = useState(String(initial));
  // The first keypress replaces the seeded value rather than appending to it.
  const [fresh, setFresh] = useState(true);

  const value = clamp(text, min);

  const press = (key: string) => {
    if (key === '⌫') {
      setFresh(false);
      setText((t) => t.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (isReps) return;
      setText((t) => (fresh ? '0.' : t.includes('.') ? t : (t || '0') + '.'));
      setFresh(false);
      return;
    }
    setText((t) => (fresh ? key : t + key));
    setFresh(false);
  };

  return (
    <Sheet onClose={onClose} ariaLabel={`${isReps ? 'Reps' : 'Weight'} keypad`}>
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">{isReps ? 'Reps' : `Weight · ${unit}`}</span>
        <span className="text-[12px] text-[color:var(--muted)]">{context}</span>
      </div>

      <p className="font-display mt-1 text-[58px]">
        {text || '0'}
        {!isReps && <span className="text-[22px] text-[color:var(--unit-dim)]"> {unit}</span>}
      </p>

      {chips.length > 0 && (
        <div className="-mx-[18px] mt-3 flex gap-1.5 overflow-x-auto px-[18px] pb-1">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => onCommit(c)}
              className="shrink-0 rounded-full bg-accent-100 px-[14px] py-1.5 text-[13px] text-accent-700 dark:bg-accent-900 dark:text-accent-300"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="mt-[14px] grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => {
          const dim = k === '.' || k === '⌫';
          return (
            <button
              key={k}
              onClick={() => press(k)}
              disabled={k === '.' && isReps}
              aria-label={k === '⌫' ? 'Delete' : k}
              className={`font-display rounded-key bg-bg py-[15px] disabled:opacity-30 ${
                dim ? 'text-[22px] text-[color:var(--key-dim)]' : 'text-[26px]'
              }`}
            >
              {k}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onCommit(value)}
        className="font-display mt-4 w-full rounded-full bg-accent py-[15px] text-[17px] text-bg"
      >
        {summary(value)}
      </button>
    </Sheet>
  );
}

/** Same clamping the Stepper applied: never below the minimum, 2 decimals. */
export function clamp(text: string, min: number): number {
  const n = Number(text);
  if (!text || Number.isNaN(n)) return min;
  return Math.max(min, Math.round(n * 100) / 100);
}
