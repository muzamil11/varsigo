'use client';

import { AlertTriangle, Check, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button, CardSkeletonList, StateMessage } from '@/components';
import {
  addFolder,
  approveUpload,
  deleteFolder,
  fetchAdminDepartments,
  fetchAdminFolders,
  fetchApprovedUploads,
  fetchPendingUploads,
  rejectUpload,
  updateUpload,
} from '@/features/admin/api';
import { AdminUploadRow } from '@/features/admin/AdminUploadRow';
import type { AdminDepartment, AdminFolder, AdminUpload } from '@/features/admin/data';
import type { UpdateUploadInput } from '@/features/admin/api';
import { useAuthStore } from '@/store/authStore';

export default function AdminUploadsPage() {
  const user = useAuthStore((s) => s.user);
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [published, setPublished] = useState<AdminUpload[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [folders, setFolders] = useState<AdminFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
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

  const loadFolders = () => {
    if (!user?.email) return;
    fetchAdminFolders(user.email)
      .then(setFolders)
      .catch(() => setFolders([]));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, [user?.email]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(loadPublished, [user?.email]);
  useEffect(loadFolders, [user?.email]);
  useEffect(() => {
    if (!user?.email) return;
    fetchAdminDepartments(user.email)
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, [user?.email]);

  const handleAddFolder = async () => {
    if (!user?.email || newFolderName.trim().length === 0) return;
    setAddingFolder(true);
    setFolderError(null);
    try {
      await addFolder(user.email, newFolderName);
      setNewFolderName('');
      loadFolders();
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : 'Could not add folder.');
    } finally {
      setAddingFolder(false);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!user?.email) return;
    if (!window.confirm('Delete this folder? Papers inside it become uncategorized, not deleted.')) return;
    try {
      await deleteFolder(user.email, id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : 'Could not delete folder.');
    }
  };

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
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              ...input,
              department: departments.find((d) => d.id === input.departmentId)?.name ?? null,
              folder: folders.find((f) => f.id === input.folderId)?.name ?? null,
            }
          : u,
      ),
    );
  };

  const handleSavePublished = async (id: string, input: UpdateUploadInput) => {
    if (!user?.email) return;
    await updateUpload(user.email, id, input);
    setPublished((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              ...input,
              department: departments.find((d) => d.id === input.departmentId)?.name ?? null,
              folder: folders.find((f) => f.id === input.folderId)?.name ?? null,
            }
          : u,
      ),
    );
  };

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
        Folders
      </h2>
      <p className="mb-3 text-xs text-muted dark:text-muted-dark">
        Papers get organized into these when you edit their details below. Add one here first if
        the subject you need doesn&apos;t exist yet.
      </p>
      <div className="mb-3 flex gap-2">
        <input
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New folder name (e.g. IPCV)"
          className="h-11 flex-1 rounded-lg border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />
        <Button
          label="Add"
          onPress={handleAddFolder}
          loading={addingFolder}
          disabled={newFolderName.trim().length === 0}
        />
      </div>
      {folderError && (
        <p className="mb-3 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
          {folderError}
        </p>
      )}
      {folders.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {folders.map((folder) => (
            <span
              key={folder.id}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
            >
              {folder.name}
              <button
                type="button"
                onClick={() => handleDeleteFolder(folder.id)}
                aria-label={`Delete folder ${folder.name}`}
                className="text-muted hover:text-red-600 dark:text-muted-dark"
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

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
            folders={folders}
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
            folders={folders}
            busy={busyId === upload.id}
            onDelete={() => handleDeletePublished(upload.id)}
            onSave={(input) => handleSavePublished(upload.id, input)}
          />
        ))
      )}
    </div>
  );
}
