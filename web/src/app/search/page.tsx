import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import { Screen } from '@/components';
import { GlobalSearch } from '@/features/search/GlobalSearch';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search teachers, papers, FAQ, and Q&A across NEDHub.',
};

export default function SearchPage() {
  return (
    <Screen>
      <Suspense fallback={null}>
        <GlobalSearch />
      </Suspense>
    </Screen>
  );
}
