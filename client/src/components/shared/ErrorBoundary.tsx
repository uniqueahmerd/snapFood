import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '../ui/Button';
import { env } from '../../constants/env'

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Replaces the default screen — e.g. a compact panel inside a page. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render errors anywhere below it (SECTION 10).
 *
 * Still a class component: `componentDidCatch` has no hook equivalent. React
 * Query handles *async* failures, so what reaches here is a genuine render bug —
 * hence the reload escape hatch rather than a silent retry.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Until an error reporter is wired up, the console is the only sink there is.
    if (env.isDev) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private reset = () => this.setState({ error: null });

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) return children;
    if (fallback) return fallback(error, this.reset);

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <span
            aria-hidden
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-error/15 text-error"
          >
            <AlertTriangle size={24} strokeWidth={2} />
          </span>

          <h1 className="mt-5 text-h3 text-text-primary">Something broke on this screen</h1>
          <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">
            The error was on our side, not yours. Nothing you saved has been lost — try again, and
            reload if it keeps happening.
          </p>

          {env.isDev ? (
            <pre className="scrollbar-thin mt-5 max-h-40 overflow-auto rounded-lg border border-border bg-inset p-3 text-left font-mono text-caption text-error">
              {error.message}
            </pre>
          ) : null}

          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="primary" onClick={this.reset}>
              Try again
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
