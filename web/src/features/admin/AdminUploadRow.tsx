'use client';

import { Check, ChevronDown, Eye, EyeOff, Pencil, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

import { Select } from '@/components';
import { getPaperFileType, PAPER_KIND_LABELS, type PaperKind } from '@/features/papers/data';
import type { AdminDepartment, AdminUpload } from './data';
import type { UpdateUploadInput } from './api';

interface AdminUploadRowProps {
  upload: AdminUpload;
  departments: AdminDepartment[];
  busy: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  onSave: (input: UpdateUploadInput) => Promise<void>;
}

/** One paper row in the admin Uploads page — used for both the pending
 *  queue and the published list, since both need the same edit form and
 *  inline file preview, and differ only in which action buttons show. */
export function AdminUploadRow({
  upload,
  departments,
  busy,
  onApprove,
  onReject,
  onDelete,
  onSave,
}: AdminUploadRowProps) {
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [title, setTitle] = useState(upload.title);
  const [subject, setSubject] = useState(upload.subject);
  const [departmentId, setDepartmentId] = useState(upload.departmentId ?? '');
  const [year, setYear] = useState(upload.year?.toString() ?? '');
  const [kind, setKind] = useState<PaperKind>(upload.kind);

  const startEdit = () => {
    setTitle(upload.title);
    setSubject(upload.subject);
    setDepartmentId(upload.departmentId ?? '');
    setYear(upload.year?.toString() ?? '');
    setKind(upload.kind);
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        title,
        subject,
        departmentId: departmentId || null,
        year: year ? Number(year) : null,
        kind,
      });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
      {editing ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              chevronSize={14}
              className="h-10 rounded-lg border border-line bg-background pl-2 text-sm text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            >
              <option value="">General</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as PaperKind)}
              chevronSize={14}
              className="h-10 rounded-lg border border-line bg-background pl-2 text-sm text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            >
              <option value="past_paper">{PAPER_KIND_LABELS.past_paper}</option>
              <option value="notes">{PAPER_KIND_LABELS.notes}</option>
            </Select>
          </div>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Year"
            inputMode="numeric"
            className="h-10 w-32 rounded-lg border border-line bg-background px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
          />
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Check size={14} />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm text-foreground dark:border-line-dark dark:text-foreground-dark"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground dark:text-foreground-dark">{upload.title}</p>
              <p className="text-xs text-muted dark:text-muted-dark">
                {upload.subject} · {PAPER_KIND_LABELS[upload.kind]} · {upload.department ?? 'General'}
                {upload.year ? ` · ${upload.year}` : ''} · {upload.createdAt}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {onApprove && (
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={busy}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600 disabled:opacity-50"
                  title="Approve"
                >
                  <Check size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={startEdit}
                disabled={busy}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent disabled:opacity-50"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              {onReject && (
                <button
                  type="button"
                  onClick={onReject}
                  disabled={busy}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 disabled:opacity-50"
                  title="Reject"
                >
                  <X size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={busy}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-accent"
          >
            {previewOpen ? <EyeOff size={12} /> : <Eye size={12} />}
            {previewOpen ? 'Hide preview' : `Preview${upload.fileUrls.length > 1 ? ` (${upload.fileUrls.length} pages)` : ''}`}
            <ChevronDown size={12} className={previewOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>

          {previewOpen && (
            <div className="mt-2 space-y-2">
              {upload.fileUrls.map((url, i) =>
                getPaperFileType(url) === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of arbitrary uploaded files, not worth Next/Image's config here
                  <img
                    key={url}
                    src={url}
                    alt={`${upload.title} page ${i + 1}`}
                    className="max-h-80 w-full rounded-lg border border-line object-contain dark:border-line-dark"
                  />
                ) : (
                  <iframe
                    key={url}
                    src={url}
                    title={`${upload.title} page ${i + 1}`}
                    className="h-80 w-full rounded-lg border border-line dark:border-line-dark"
                  />
                ),
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
