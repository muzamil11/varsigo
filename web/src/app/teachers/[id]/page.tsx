import { BadgeCheck, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import { Screen } from '@/components';
import { ReviewsSection } from '@/features/teachers/ReviewsSection';
import { fetchTeacherPublicById } from '@/features/teachers/api';

export const revalidate = 300;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const teacher = await fetchTeacherPublicById(id);
    return {
      title: teacher.name,
      description: `${teacher.name}${teacher.department ? ` — ${teacher.department}` : ''} at NED University. Sign in to see student ratings and reviews.`,
    };
  } catch {
    return { title: 'Teacher' };
  }
}

export default async function TeacherDetailPage({ params }: Props) {
  const { id } = await params;
  let teacher;
  try {
    teacher = await fetchTeacherPublicById(id);
  } catch {
    notFound();
  }

  return (
    <Screen>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <Users size={28} className="text-accent" />
          </div>
          <div className="ml-4">
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                {teacher.name}
              </h1>
              {teacher.verificationStatus === 'admin_verified' && (
                <BadgeCheck size={18} className="text-accent" />
              )}
            </div>
            <p className="text-sm text-muted dark:text-muted-dark">
              {teacher.department ?? 'Department not set'}
            </p>
          </div>
        </div>

        {teacher.courses.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {teacher.courses.map((course) => (
              <span
                key={course.id}
                className="rounded-full border border-line bg-card px-3 py-1 text-xs text-muted dark:border-line-dark dark:bg-card-dark dark:text-muted-dark"
              >
                {course.code ? `${course.code} — ${course.name}` : course.name}
              </span>
            ))}
          </div>
        )}

        <ReviewsSection teacherId={id} />
      </div>
    </Screen>
  );
}
