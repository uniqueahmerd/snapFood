import { cn } from '../../utils/cn';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'block' | 'circle';
}

export function Skeleton({ className, variant = 'block' }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'block animate-pulse rounded-lg bg-slate-200',
        variant === 'text' && 'h-4 w-full',
        variant === 'block' && 'h-20 w-full',
        variant === 'circle' && 'h-12 w-12 rounded-full',
        className,
      )}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-5', className)} aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-6 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
    </div>
  );
}
