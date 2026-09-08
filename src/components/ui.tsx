import type { ReactNode } from 'react';

/** Shared Organic primitives, so every screen uses the same pills and cards. */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-card bg-surface p-[18px] shadow-sm lg:p-[22px] ${className}`}>
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`font-display rounded-full bg-accent px-5 py-[13px] text-[16px] text-bg transition-colors duration-100 hover:bg-accent-600 active:bg-accent-700 disabled:opacity-40 dark:active:bg-accent-400 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = '',
  tone = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'default' | 'accent' }) {
  const text = tone === 'accent' ? 'text-accent-700 dark:text-accent-300' : 'text-ink';
  return (
    <button
      {...props}
      className={`font-display rounded-full border border-[color:var(--divider)] px-5 py-3 text-[15px] transition-colors duration-100 hover:bg-[color:var(--row-line)] ${text} ${className}`}
    >
      {children}
    </button>
  );
}

export type TagTone = 'accent' | 'neutral' | 'accent2';

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: TagTone }) {
  const tones: Record<TagTone, string> = {
    accent: 'bg-accent-100 text-accent-800 dark:bg-accent-800 dark:text-accent-300',
    neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300',
    accent2: 'bg-accent2-100 text-accent2-800 dark:bg-accent2-800 dark:text-accent2-300',
  };
  return (
    <span className={`rounded-full px-[10px] py-[3px] text-[11px] ${tones[tone]}`}>{children}</span>
  );
}

/** Two-or-three-way segmented control, used for Recovery/Volume, units and theme. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex w-full overflow-hidden rounded-full border border-[color:var(--divider)]"
    >
      {options.map((o, i) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`flex-1 py-[11px] text-[13px] transition-colors duration-100 ${
            i > 0 ? 'border-l border-[color:var(--divider)]' : ''
          } ${
            value === o.value
              ? 'font-display bg-accent text-bg'
              : 'text-[color:var(--muted)] hover:bg-[color:var(--row-line)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Bottom-sheet chrome: backdrop, rounded panel, grab handle. */
export function Sheet({
  children,
  onClose,
  ariaLabel,
}: {
  children: ReactNode;
  onClose: () => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="backdrop-in fixed inset-0 z-50 flex items-end bg-[rgba(46,43,37,.35)]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="sheet-in max-h-[85vh] w-full overflow-y-auto rounded-t-sheet bg-surface px-[18px] pb-[26px] pt-4 shadow-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={ariaLabel}
      >
        <div className="mx-auto mb-[14px] h-1 w-11 rounded-full bg-[color:var(--grab)]" />
        {children}
      </div>
    </div>
  );
}

export function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border-[1.5px] border-dashed border-[color:var(--dashed)] p-6 text-center text-[14px] text-[color:var(--muted)]">
      {children}
    </div>
  );
}
