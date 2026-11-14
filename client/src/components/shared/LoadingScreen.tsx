import { Spinner } from '../ui/Spinner';
import { cn } from '../../utils/cn';

export interface LoadingScreenProps {
  label?: string;
  /** `page` fills the content area; `full` fills the viewport. */
  variant?: 'page' | 'full';
  className?: string;
}

/**
 * Centred spinner for the two waits that have no meaningful skeleton: the session
 * bootstrap before any layout exists, and a lazily loaded route chunk.
 *
 * Data loading inside a page should use the matching `Skeleton*` instead — a
 * skeleton that mirrors the final layout beats a spinner that says nothing about
 * what is coming.
 */
export function LoadingScreen({ label, variant = 'full', className }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 bg-background',
        variant === 'full' ? 'min-h-screen' : 'min-h-[50vh] w-full',
        className,
      )}
    >
      <Spinner size="lg" className="text-primary" label={null} />
      <p className="text-body-sm text-text-secondary">{label ?? 'Loading…'}</p>
    </div>
  );
}
