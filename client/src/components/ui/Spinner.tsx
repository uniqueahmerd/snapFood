import { cn } from '../../utils/cn';

const SIZES = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-[3px]',
} as const;

export interface SpinnerProps {
  size?: keyof typeof SIZES;
  className?: string;
  /** Announced to screen readers. Set to `null` on purely decorative spinners. */
  label?: string | null;
}

/**
 * Indeterminate loading ring. Inherits `currentColor`, so it takes the colour of
 * whatever it sits inside — a button, a card, a page.
 */
export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
      className={cn('inline-flex shrink-0', className)}
    >
      <span
        className={cn(
          'animate-spin rounded-full border-current border-t-transparent',
          SIZES[size],
        )}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

/** Three-dot "AI is thinking" indicator used in the chat transcript. */
export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} role="status">
      <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-text-secondary" />
      <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-text-secondary [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-text-secondary [animation-delay:300ms]" />
      <span className="sr-only">SnapFood is thinking</span>
    </span>
  );
}
