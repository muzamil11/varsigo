'use client';

import { ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { Button, Screen } from '@/components';
import { usePrivacyStore } from '@/store/privacyStore';

export default function PrivacyNoticePage() {
  const router = useRouter();

  const handleAccept = () => {
    usePrivacyStore.getState().accept();
    router.replace('/');
  };

  return (
    <Screen>
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
          <ShieldCheck size={28} color="#FFFFFF" />
        </div>
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Privacy Notice
        </h1>
        <p className="mt-4 text-base leading-6 text-muted dark:text-muted-dark">
          Varsigo stores your email and name to personalize your experience. Your reviews can be
          posted anonymously. We never sell your data. Files you upload are shared with all NED
          students.
        </p>

        <Button label="Accept & Continue" onPress={handleAccept} className="mt-8" />
      </div>
    </Screen>
  );
}
