'use client';

import { SearchX } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Screen, StateMessage } from '@/components';

export default function NotFound() {
  return (
    <Screen>
      <StateMessage icon={SearchX} title="Page not found" subtitle="This page doesn't exist or was removed." />
      <div className="flex justify-center pb-12">
        <Link href="/" className="rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white">
          Back to Home
        </Link>
      </div>
    </Screen>
  );
}
