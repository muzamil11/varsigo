'use client';

import { AlertTriangle, Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CardSkeletonList, StateMessage } from '@/components';
import {
  approveUpload,
  fetchAdminDepartments,
  fetchApprovedUploads,
  fetchPendingUploads,
  rejectUpload,
  updateUpload,
} from '@/features/admin/api';
import { AdminUploadRow } from '@/features/admin/AdminUploadRow';
import type { AdminDepartment, AdminUpload } from '@/features/admin/data';
import type { UpdateUploadInput } from '@/features/admin/api';
import { useAuthStore } from '@/store/authStore';

export default function AdminUploadsPage() {
  const user = useAuthStore((s) => s.user);
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [published, setPublished] = useState<AdminUpload[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishedLoading, setPublishedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishedError, setPublishedError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    if (!user?.email) return;
    setLoading(true);
    fetchPendingUploads(user.email)
      .then(setUploads)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  const loadPublished = () => {
    if (!user?.email) return;
    setPublishedLoading(true);
    fetchApprovedUploads(user.email)
      .then(setPublished)
      .catch((err) => setPublishedError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setPublishedLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, [user?.email]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(loadPublished, [user?.email]);
  useEffect(() => {
    if (!user?.email) return;
    fetchAdminDepartments(user.email)
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, [user?.email]);

  const handleApprove = async (id: string) => {
    if (!user?.email) return;
    setBusyId(id);
    try {
      await approveUpload(user.email, id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
      loadPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!user?.email) return;
    setBusyId(id);
    try {
      await rejectUpload(user.email, id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeletePublished = async (id: string) => {
    if (!user?.email) return;
    if (!window.confirm('Delete this paper? It will be removed from the site immediately.')) return;
    setBusyId(id);
    try {
      await rejectUpload(user.email, id);
      setPublished((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setPublishedError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSavePending = async (id: string, input: UpdateUploadInput) => {
    if (!user?.email) return;
    await updateUpload(user.email, id, input);
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...input, department: departments.find((d) => d.id === input.departmentId)?.name ?? null } : u)));
  };

  const handleSavePublished = async (id: string, input: UpdateUploadInput) => {
    if (!user?.email) return;
    await updateUpload(user.email, id, input);
    setPublished((prev) => prev.map((u) => (u.id === id ? { ...u, ...input, department: departments.find((d) => d.id === input.departmentId)?.name ?? null } : u)));
  };

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
        Pending review
      </h2>
      {loading ? (
        <CardSkeletonList padded={false} />
      ) : error ? (
        <StateMessage icon={AlertTriangle} title="Couldn't load uploads" subtitle={error} />
      ) : uploads.length === 0 ? (
        <StateMessage icon={Check} title="All caught up" subtitle="No pending uploads." />
      ) : (
        uploads.map((upload) => (
          <AdminUploadRow
            key={upload.id}
            upload={upload}
            departments={departments}
            busy={busyId === upload.id}
            onApprove={() => handleApprove(upload.id)}
            onReject={() => handleReject(upload.id)}
            onSave={(input) => handleSavePending(upload.id, input)}
          />
        ))
      )}

      <h2 className="mb-3 mt-8 text-base font-semibold text-foreground dark:text-foreground-dark">
        Published papers
      </h2>
      <p className="mb-3 text-xs text-muted dark:text-muted-dark">
        Already live on /papers — edit its details or delete it to remove it from the site immediately.
      </p>
      {publishedLoading ? (
        <CardSkeletonList padded={false} />
      ) : publishedError ? (
        <StateMessage icon={AlertTriangle} title="Couldn't load published papers" subtitle={publishedError} />
      ) : published.length === 0 ? (
        <StateMessage icon={Check} title="Nothing published yet" />
      ) : (
        published.map((upload) => (
          <AdminUploadRow
            key={upload.id}
            upload={upload}
            departments={departments}
            busy={busyId === upload.id}
            onDelete={() => handleDeletePublished(upload.id)}
            onSave={(input) => handleSavePublished(upload.id, input)}
          />
        ))
      )}
    </div>
  );
}
