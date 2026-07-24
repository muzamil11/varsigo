'use client';

import React from 'react';

import { Button, Screen } from '@/components';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Screen>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-2 text-xl font-bold text-foreground dark:text-foreground-dark">
          Something went wrong
        </p>
        <p className="mb-6 text-sm text-muted dark:text-muted-dark">
          Please try again — if it keeps happening, reload the page.
        </p>
        <Button label="Try again" onPress={reset} />
      </div>
    </Screen>
  );
}
