import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui';
import { startGoogleOAuth } from '@/hooks';
import { GOOGLE_BRAND_COLORS } from '@/theme/colors';
import { cn } from '../../utils/cn';

/**
 * Small pieces shared by the six auth screens.
 *
 * They live here rather than in `components/shared` because nothing outside
 * `pages/auth` has any use for them, and because keeping them together is what
 * lets each screen stay well under the 200-line limit in SECTION 10.
 */

export interface AuthHeadingProps {
  title: string;
  description?: ReactNode;
}

export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <header className="mb-7 ">
      <h1 className="text-h2 text-text-primary">{title}</h1>
      {description ? (
        <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">{description}</p>
      ) : null}
    </header>
  );
}

/**
 * Google's mark, inlined.
 *
 * Their brand guidelines require the four-colour "G" — a monochrome Lucide glyph
 * would be wrong. Inlining it keeps the button from depending on a network
 * request that could leave the primary sign-in path looking broken.
 */
function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden focusable="false">
      <path
        fill={GOOGLE_BRAND_COLORS.blue}
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill={GOOGLE_BRAND_COLORS.green}
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill={GOOGLE_BRAND_COLORS.yellow}
        d="M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.09l3.01-2.34Z"
      />
      <path
        fill={GOOGLE_BRAND_COLORS.red}
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export interface GoogleButtonProps {
  label?: string;
  disabled?: boolean;
}

/**
 * SECTION 9: starts the OAuth flow with a full page navigation, not an XHR — the
 * browser has to follow the backend's redirect to Google's consent screen, and
 * the httpOnly refresh cookie is set on the trip back.
 */
export function GoogleButton({ label = 'Continue with Google', disabled }: GoogleButtonProps) {
  return (
    <Button
      variant="secondary"
      size="lg"
      fullWidth
      disabled={disabled}
      onClick={startGoogleOAuth}
      className="gap-2.5"
    >
      <GoogleMark />
      {label}
    </Button>
  );
}

export interface AuthDividerProps {
  label?: string;
  className?: string;
}

export function AuthDivider({ label = 'or email', className }: AuthDividerProps) {
  return (
    <div className={cn('flex items-center gap-3', className)} aria-hidden>
      <span className="h-px flex-1 bg-border" />
      <span className="text-label-caps uppercase text-text-secondary">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export interface AuthFooterProps {
  question: string;
  to: string;
  linkLabel: string;
}

export function AuthFooter({ question, to, linkLabel }: AuthFooterProps) {
  return (
    <p className="mt-7 text-center text-body-sm text-text-secondary">
      {question}{' '}
      <Link
        to={to}
        className="font-semibold text-info underline-offset-4 transition-colors hover:underline"
      >
        {linkLabel}
      </Link>
    </p>
  );
}

/**
 * Terminal state for the screens that report an outcome rather than collect
 * input — email verification, and "check your inbox" after a reset request.
 */
export interface AuthResultProps {
  tone: 'success' | 'error' | 'info';
  icon: ReactNode;
  title: string;
  description: ReactNode;
  children?: ReactNode;
}

const TONES: Record<AuthResultProps['tone'], string> = {
  success: 'border-success/40 bg-success/10 text-success',
  error: 'border-error/40 bg-error/10 text-error',
  info: 'border-primary/40 bg-primary/10 text-info',
};

export function AuthResult({ tone, icon, title, description, children }: AuthResultProps) {
  return (
    <div className="text-center">
      <span
        className={cn(
          'mx-auto grid h-14 w-14 place-items-center rounded-full border',
          TONES[tone],
        )}
      >
        {icon}
      </span>

      <h1 className="mt-5 text-h3 text-text-primary">{title}</h1>
      <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">{description}</p>

      {children ? <div className="mt-7">{children}</div> : null}
    </div>
  );
}
