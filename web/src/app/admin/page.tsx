'use client';

import React, { useEffect, useState } from 'react';

import { Card, CardSkeletonList, StateMessage } from '@/components';
import type { AdminStats } from '@/features/admin/data';
import { fetchAdminStats } from '@/features/admin/api';
import { useAuthStore } from '@/store/authStore';
import { AlertTriangle } from 'lucide-react';

const STAT_LABELS: { key: keyof AdminStats; label: string }[] = [
  { key: 'totalDepartments', label: 'Departments' },
  { key: 'totalTeachers', label: 'Teachers' },
  { key: 'totalCourses', label: 'Courses' },
  { key: 'approvedReviews', label: 'Approved reviews' },
  { key: 'approvedUploads', label: 'Approved uploads' },
  { key: 'pendingReviews', label: 'Pending reviews' },
  { key: 'pendingUploads', label: 'Pending uploads' },
  { key: 'pendingTeacherSuggestions', label: 'Pending suggestions' },
  { key: 'pendingCommunityReports', label: 'Community reports' },
];

export default function AdminOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    fetchAdminStats(user.email)
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load stats.'))
      .finally(() => setLoading(false));
  }, [user?.email]);

  if (loading) return <CardSkeletonList padded={false} count={4} />;
  if (error) return <StateMessage icon={AlertTriangle} title="Couldn't load stats" subtitle={error} />;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {STAT_LABELS.map(({ key, label }) => (
        <Card key={key}>
          <p className="text-2xl font-bold text-foreground dark:text-foreground-dark">{stats[key]}</p>
          <p className="text-xs text-muted dark:text-muted-dark">{label}</p>
        </Card>
      ))}
    </div>
  );
}
