import React from 'react';
import { Text, View } from 'react-native';

import { Button } from './Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6 dark:bg-background-dark">
      <Text className="mb-2 text-center text-xl font-bold text-foreground dark:text-foreground-dark">
        Something went wrong
      </Text>
      <Text className="mb-6 text-center text-sm text-muted dark:text-muted-dark">
        NEDHub ran into an unexpected error. Try again — if it keeps happening, close and
        reopen the app.
      </Text>
      <Button label="Try again" onPress={onRetry} />
    </View>
  );
}

/** Top-level safety net (wraps the whole app in _layout.tsx): catches any
 *  otherwise-uncaught render error and shows a friendly retry screen instead
 *  of the app crashing/freezing outright. Must be a class component — React
 *  has no hook equivalent for getDerivedStateFromError/componentDidCatch. */
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
