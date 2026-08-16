import type { Metadata } from 'next';
import React from 'react';

import { Screen } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import { TeacherBrowser } from '@/features/teachers/TeacherBrowser';
import { fetchTeachers } from '@/features/teachers/api';

// Shorter than most other pages' 300s — this page shows each teacher's
// aggregate rating/review count, which should catch up reasonably soon
// after an admin approves a new review instead of staying stale for 5 min.
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Teachers',
  description: 'Browse NED University teachers by department and course. Sign in to see ratings and student reviews.',
};

export default async function TeachersPage() {
  // Caught here rather than left to throw: a Supabase outage (or, during
  // local/CI builds, missing env vars) shouldn't fail this page's static
  // generation — render an empty state instead, same as the client-side
  // data-loading screens elsewhere in the app.
  let teachers: Awaited<ReturnType<typeof fetchTeachers>> = [];
  let departments: Awaited<ReturnType<typeof fetchDepartments>> = [];
  let error: string | null = null;
  try {
    [teachers, departments] = await Promise.all([fetchTeachers(), fetchDepartments()]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load teachers.';
  }

  // Rating/reviewCount are shown on the list so visitors can judge at a
  // glance whether a teacher has reviews worth reading — but the review
  // text itself stays gated behind sign-in, see the (gated) reviews
  // section on the teacher detail page.
  const publicTeachers = teachers.map((t) => ({
    id: t.id,
    name: t.name,
    department: t.department,
    courses: t.courses,
    verificationStatus: t.verificationStatus,
    rating: t.rating,
    reviewCount: t.reviewCount,
  }));

  return (
    <Screen>
      <TeacherBrowser teachers={publicTeachers} departments={departments} error={error} />
    </Screen>
  );
}
