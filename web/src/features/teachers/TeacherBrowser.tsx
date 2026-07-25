'use client';

import { AlertTriangle, BadgeCheck, Search as SearchIcon, Users } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { AnimatedListItem, Card, Chip, SearchBar, StateMessage } from '@/components';
import type { Department } from '@/features/departments/types';

export interface PublicTeacherListItem {
  id: string;
  name: string;
  department: string | null;
  courses: { id: string; code: string | null; name: string }[];
  verificationStatus: 'admin_verified' | 'suggestion_approved' | 'unverified';
}

interface TeacherBrowserProps {
  teachers: PublicTeacherListItem[];
  departments: Department[];
  error?: string | null;
}

export function TeacherBrowser({ teachers, departments, error }: TeacherBrowserProps) {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (departmentId) {
        const dept = departments.find((d) => d.id === departmentId);
        if (dept && t.department !== dept.name) return false;
      }
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.department ?? '').toLowerCase().includes(q) ||
        t.courses.some((c) => c.name.toLowerCase().includes(q) || (c.code ?? '').toLowerCase().includes(q))
      );
    });
  }, [teachers, search, departmentId, departments]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-foreground dark:text-foreground-dark">
        Teachers
      </h1>
      <p className="mb-6 text-sm text-muted dark:text-muted-dark">
        Sign in to see ratings and reviews for any teacher.
      </p>

      <div className="max-w-xl">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((teacher, index) => (
              <AnimatedListItem key={teacher.id} index={index}>
                <Link href={`/teachers/${teacher.id}`} className="block h-full">
                  <Card className="h-full">
                    <div className="flex items-center">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <Users size={20} className="text-accent" />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-semibold text-foreground dark:text-foreground-dark">
                            {teacher.name}
                          </p>
                          {teacher.verificationStatus === 'admin_verified' && (
                            <BadgeCheck size={14} className="shrink-0 text-accent" />
                          )}
                        </div>
                        <p className="truncate text-sm text-muted dark:text-muted-dark">
                          {teacher.department ?? 'Department not set'}
                        </p>
                      </div>
                    </div>
                    {teacher.courses.length > 0 && (
                      <p className="mt-3 line-clamp-2 text-xs text-muted dark:text-muted-dark">
                        {teacher.courses.map((c) => c.code ?? c.name).join(', ')}
                      </p>
                    )}
                  </Card>
                </Link>
              </AnimatedListItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
