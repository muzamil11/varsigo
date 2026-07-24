'use client';

import { AlertTriangle, Check, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CardSkeletonList, StateMessage } from '@/components';
import { dismissCommunityReport, fetchReportedCommunity, hideCommunityItem } from '@/features/admin/api';
import type { AdminCommunityReport } from '@/features/admin/data';
import { useAuthStore } from '@/store/authStore';

export default function AdminCommunityPage() {
  const user = useAuthStore((s) => s.user);
  const [reports, setReports] = useState<AdminCommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    if (!user?.email) return;
    setLoading(true);
    fetchReportedCommunity(user.email)
      .then(setReports)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, [user?.email]);

  const handleDismiss = async (report: AdminCommunityReport) => {
    if (!user?.email) return;
    setBusyId(report.id);
    try {
      await dismissCommunityReport(user.email, report);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleHide = async (report: AdminCommunityReport) => {
    if (!user?.email) return;
    setBusyId(report.id);
    try {
      await hideCommunityItem(user.email, report);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <CardSkeletonList padded={false} />;
  if (error) return <StateMessage icon={AlertTriangle} title="Couldn't load reports" subtitle={error} />;
  if (reports.length === 0) {
    return <StateMessage icon={Check} title="All caught up" subtitle="No reported Q&A content." />;
  }

  return (
    <div>
      {reports.map((report) => (
        <div
          key={report.id}
          className="mb-3 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-accent">{report.kind}</p>
              <p className="font-semibold text-foreground dark:text-foreground-dark">{report.title}</p>
              <p className="mt-1 text-sm text-muted dark:text-muted-dark">{report.body}</p>
              <p className="mt-2 text-xs text-muted dark:text-muted-dark">
                Reported {report.reportedCount}x · {report.createdAt}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDismiss(report)}
                disabled={busyId === report.id}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600 disabled:opacity-50"
                title="Dismiss report"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleHide(report)}
                disabled={busyId === report.id}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 disabled:opacity-50"
                title="Hide content"
              >
                <EyeOff size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
