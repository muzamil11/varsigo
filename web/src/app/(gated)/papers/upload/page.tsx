'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button, Screen } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { uploadPaper, validateUploadFiles } from '@/features/papers/api';
import type { PaperKind } from '@/features/papers/data';
import { formatFileSize } from '@/features/papers/data';
import { useAuthStore } from '@/store/authStore';

export default function UploadPaperPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [kind, setKind] = useState<PaperKind>('past_paper');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  const canSubmit =
    title.trim().length > 0 && subject.trim().length > 0 && files.length > 0 && !submitting;

  const handleFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    const validationError = validateUploadFiles(picked);
    setError(validationError);
    setFiles(picked);
  };

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await uploadPaper({
        userId: user.id,
        title,
        subject,
        departmentId: departmentId || null,
        year: year ? Number(year) : null,
        kind,
        files,
      });
      // Keep the spinner through the navigation instead of resetting it
      // first — see login/page.tsx's comment for why.
      router.push('/papers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload.');
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Upload a paper or notes
        </h1>
        <p className="mb-6 text-sm text-muted dark:text-muted-dark">
          Shared with all NED students after moderation.
        </p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. Midterm 2024)"
          className="mb-3 h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (e.g. Data Structures)"
          className="mb-3 h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />

        <div className="mb-3 flex gap-3">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-12 flex-1 rounded-xl border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
          >
            <option value="">Department (optional)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
            placeholder="Year"
            className="h-12 w-28 rounded-xl border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
          />
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setKind('past_paper')}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium ${
              kind === 'past_paper'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
            }`}
          >
            Past Paper
          </button>
          <button
            type="button"
            onClick={() => setKind('notes')}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium ${
              kind === 'notes'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
            }`}
          >
            Notes
          </button>
        </div>

        <label className="mb-2 block rounded-xl border border-dashed border-line bg-card p-4 text-center text-sm text-muted dark:border-line-dark dark:bg-card-dark dark:text-muted-dark">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {files.length > 0
            ? `${files.length} file(s) selected (${formatFileSize(files.reduce((sum, f) => sum + f.size, 0))})`
            : 'Choose a PDF or images to upload'}
        </label>

        {error && (
          <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
            {error}
          </p>
        )}

        <Button
          label="Upload"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
          className="mt-2"
        />
      </div>
    </Screen>
  );
}
