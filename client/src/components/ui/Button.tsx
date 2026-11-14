import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '../../utils/cn';

import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'success'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-text-on-primary hover:bg-primary-hover active:bg-primary-hover',
  secondary:
    'bg-surface-high text-text-primary border border-border hover:bg-elevated hover:border-border-strong',
  ghost: 'text-text-secondary hover:bg-surface-high hover:text-text-primary',
  outline:
    'border border-border text-text-primary hover:bg-surface-high hover:border-border-strong',
  danger: 'bg-error text-background hover:bg-error/90',
  success: 'bg-success text-text-on-primary hover:bg-success/90',
  link: 'text-info underline-offset-4 hover:underline p-0 h-auto',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-caption gap-1.5',
  md: 'h-10 px-4 text-body-sm gap-2',
  lg: 'h-11 px-5 text-body-sm gap-2',
  icon: 'h-10 w-10 p-0',
  'icon-sm': 'h-8 w-8 p-0',
};

const BASE =
  'inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap ' +
  'transition-colors duration-150 select-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:opacity-50';

/**
 * Shared class string, so a `<Link>` can be styled as a button without
 * duplicating the variant table or nesting an anchor inside a button.
 */
export function buttonStyles(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Swaps the leading icon for a spinner and blocks interaction. */
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  /** Stretches to the container width — used in forms and modal footers. */
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth = false,
    className,
    disabled,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const iconOnly = size === 'icon' || size === 'icon-sm';
  const iconSize = size === 'sm' || size === 'icon-sm' ? 14 : 16;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(buttonStyles(variant, size, className), fullWidth && 'w-full')}
      {...rest}
    >
      {isLoading ? (
        <Spinner size={size === 'sm' || size === 'icon-sm' ? 'xs' : 'sm'} label={null} />
      ) : (
        LeftIcon && <LeftIcon size={iconSize} strokeWidth={2} aria-hidden />
      )}

      {/* An icon-only button keeps its label for assistive tech via aria-label. */}
      {!iconOnly && children}

      {RightIcon && !isLoading ? <RightIcon size={iconSize} strokeWidth={2} aria-hidden /> : null}
    </button>
  );
});
