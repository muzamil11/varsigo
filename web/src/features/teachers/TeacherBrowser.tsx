'use client';

import { AlertTriangle, BadgeCheck, Search as SearchIcon, Users } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { AnimatedListItem, Card, Chip, PageShell, SearchBar, StateMessage } from '@/components';
import { formatCourse } from '@/features/courses/types';
import type { Department } from '@/features/departments/types';

export interface PublicTeacherListItem {
  id: string;
  name: string;
  department: string | null;
  courses: { id: string; code: string | null; name: string }[];
  verificationStatus: 'admin_verified' | 'suggestion_approved' | 'unverified';
  rating: number | null;
  reviewCount: number;
}

interface TeacherBrowserProps {
  teachers: PublicTeacherListItem[];
  departments: Department[];
  error?: string | null;
}

function normalizeSearchValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(dr|mr|ms|mrs|prof)\.?\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function matchesSearch(text: string | null | undefined, query: string): boolean {
  const normalized = normalizeSearchValue(text ?? '');
  if (!normalized) return false;
  return normalized.includes(query) || query.split(' ').every((part) => normalized.includes(part));
}

export function TeacherBrowser({ teachers, departments, error }: TeacherBrowserProps) {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = normalizeSearchValue(search);
    return teachers.filter((t) => {
      if (departmentId) {
        const dept = departments.find((d) => d.id === departmentId);
        if (dept && t.department !== dept.name) return false;
      }
      if (!q) return true;
      return (
        matchesSearch(t.name, q) ||
        matchesSearch(t.department, q) ||
        t.courses.some((c) => matchesSearch(c.name, q) || matchesSearch(c.code, q) || matchesSearch(formatCourse(c), q))
      );
    });
  }, [teachers, search, departmentId, departments]);

  return (
    <PageShell className="py-10">
      <h1 className="mb-1 text-3xl font-bold text-foreground dark:text-foreground-dark">
        Teachers
      </h1>
      <p className="mb-6 text-sm text-muted dark:text-muted-dark">
        Sign in to read full reviews for any teacher.
      </p>

      <div className="max-w-3xl">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search teachers, courses…" />
      </div>

      <div className="mt-4 flex flex-wrap">
        <Chip label="All" selected={!departmentId} onPress={() => setDepartmentId(null)} />
        {departments.map((d) => (
          <Chip
            key={d.id}
            label={d.name}
            selected={departmentId === d.id}
            onPress={() => setDepartmentId(d.id)}
          />
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <StateMessage icon={AlertTriangle} title="Couldn't load teachers" subtitle={error} />
        ) : filtered.length === 0 ? (
          <StateMessage
            icon={SearchIcon}
            title="No teachers found"
            subtitle="Try a different search or filter."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((teacher, index) => (
              <AnimatedListItem key={teacher.id} index={index}>
                <Link href={`/teachers/${teacher.id}`} className="block h-full">
                  <Card className="h-full">
                    <div className="flex items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <Users size={20} className="text-accent" />
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="flex items-start gap-1.5">
                          <p
                            className="break-words font-semibold leading-snug text-foreground dark:text-foreground-dark"
                            title={teacher.name}
                          >
                            {teacher.name}
                          </p>
                          {teacher.verificationStatus === 'admin_verified' && (
                            <BadgeCheck size={14} className="mt-0.5 shrink-0 text-accent" />
                          )}
                        </div>
                        <p className="truncate text-sm text-muted dark:text-muted-dark">
                          {teacher.department ?? 'Department not set'}
                        </p>
                      </div>
                      {teacher.rating !== null ? (
                        <span className="ml-2 shrink-0 rounded-lg bg-accent/10 px-2 py-1 text-sm font-semibold text-accent">
                          ⭐ {teacher.rating.toFixed(1)} ({teacher.reviewCount})
                        </span>
                      ) : (
                        <span className="ml-2 shrink-0 rounded-lg bg-line px-2 py-1 text-xs font-medium text-muted dark:bg-line-dark dark:text-muted-dark">
                          New
                        </span>
                      )}
                    </div>
                    {teacher.courses.length > 0 && (
                      <p className="mt-3 line-clamp-2 text-xs text-muted dark:text-muted-dark">
                        {teacher.courses.map(formatCourse).join(', ')}
                      </p>
                    )}
                  </Card>
                </Link>
              </AnimatedListItem>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
