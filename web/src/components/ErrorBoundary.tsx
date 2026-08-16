'use client';

import React from 'react';

import { Button } from './Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 dark:bg-background-dark">
      <p className="mb-2 text-center text-xl font-bold text-foreground dark:text-foreground-dark">
        Something went wrong
      </p>
      <p className="mb-6 text-center text-sm text-muted dark:text-muted-dark">
        NEDHub ran into an unexpected error. Try again — if it keeps happening, reload the page.
      </p>
      <Button label="Try again" onPress={onRetry} />
    </div>
  );
}

/** Top-level safety net (wraps the app in layout.tsx): catches any
 *  otherwise-uncaught render error and shows a friendly retry screen instead
 *  of a blank page. Must be a class component — React has no hook equivalent
 *  for getDerivedStateFromError/componentDidCatch. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[ErrorBoundary] caught render error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
