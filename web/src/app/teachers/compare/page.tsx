import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';

import { Screen } from '@/components';
import { CompareTeachers } from '@/features/teachers/CompareTeachers';
import { fetchTeachersByIds } from '@/features/teachers/api';
import { MIN_COMPARE_TEACHERS } from '@/features/teachers/data';

export const metadata: Metadata = {
  title: 'Compare Teachers',
  description: 'Compare NED University teachers side by side — ratings, grading, attendance and more.',
};

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

export default async function CompareTeachersPage({ searchParams }: Props) {
  const { ids: idsParam } = await searchParams;
  const ids = (idsParam ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  // Public aggregate data only (rating/reviewCount/breakdown) — same as the
  // Teachers list. Caught rather than left to throw, same tolerance the
  // Teachers page has for a Supabase outage during rendering.
  let teachers: Awaited<ReturnType<typeof fetchTeachersByIds>> = [];
  try {
    teachers = await fetchTeachersByIds(ids);
  } catch {
    teachers = [];
  }

  // Reachable only via a hand-edited or stale URL — the app's own "Compare"
  // button always sends 2-4 valid ids. Redirects rather than rendering an
  // inline empty state here, so CompareTeachers can assume it always has
  // enough teachers to compare.
  if (teachers.length < MIN_COMPARE_TEACHERS) {
    redirect('/teachers');
  }

  return (
    <Screen>
      <CompareTeachers teachers={teachers} />
    </Screen>
  );
}
