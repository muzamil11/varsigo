'use client';

import {
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Info,
  Tags,
  UploadCloud,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { Button, Screen } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { uploadPaper, validateUploadFiles } from '@/features/papers/api';
import type { PaperKind } from '@/features/papers/data';
import { formatFileSize } from '@/features/papers/data';
import { useAuthStore } from '@/store/authStore';

const YEARS = ['2026', '2025', '2024', '2023', '2022'];

const STEPS = [
  { label: 'Info', icon: Info },
  { label: 'Course', icon: GraduationCap },
  { label: 'Upload', icon: UploadCloud },
];

function fieldClass(extra = '') {
  return `h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-foreground outline-none focus:border-accent dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark ${extra}`;
}

function Stepper({ step }: { step: number }) {
  return (
    <div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const complete = index < step;
          const active = index === step;
          return (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                  complete
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : active
                      ? 'border-accent bg-accent text-white'
                      : 'border-line bg-background text-muted dark:border-line-dark dark:bg-background-dark dark:text-muted-dark'
                }`}
              >
                {complete ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={`text-xs font-semibold ${
                  active || complete ? 'text-foreground dark:text-foreground-dark' : 'text-muted dark:text-muted-dark'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function UploadPaperPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(0);
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

  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === departmentId),
    [departments, departmentId],
  );

  const canSubmit =
    title.trim().length > 0 && subject.trim().length > 0 && files.length > 0 && !submitting;
  const canContinue =
    step === 0
      ? title.trim().length > 0 && Boolean(year)
      : step === 1
        ? subject.trim().length > 0
        : files.length > 0;

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const handleFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    const validationError = validateUploadFiles(picked);
    setError(validationError);
    setFiles(picked);
  };

  const handleNext = () => {
    if (!canContinue) return;
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
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
      router.push('/papers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload.');
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-line bg-card dark:border-line-dark dark:bg-card-dark">
          <div className="border-b border-line p-5 dark:border-line-dark">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <UploadCloud size={22} className="text-accent" />
                <div>
                  <h1 className="text-xl font-bold text-foreground dark:text-foreground-dark">
                    Upload Past Paper
                  </h1>
                  <p className="text-sm text-muted dark:text-muted-dark">
                    Shared after admin approval.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Step {step + 1} of 3
              </span>
            </div>
            <Stepper step={step} />
          </div>

          <div className="p-5">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground dark:text-foreground-dark">
                    <FileText size={16} className="text-accent" />
                    Paper title
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Data Structures Final 2025"
                    className={fieldClass()}
                  />
                  <p className="mt-1.5 text-xs text-muted dark:text-muted-dark">
                    Include course, exam type, and year so students can search it easily.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground dark:text-foreground-dark">
                      <Tags size={16} className="text-accent" />
                      Type
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setKind('past_paper')}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
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
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                          kind === 'notes'
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
                        }`}
                      >
                        Notes
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground dark:text-foreground-dark">
                      <CalendarDays size={16} className="text-accent" />
                      Year
                    </div>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={fieldClass()}
                    >
                      <option value="">Select year</option>
                      {YEARS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground dark:text-foreground-dark">
                    <Building2 size={16} className="text-accent" />
                    Department
                  </div>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className={fieldClass()}
                  >
                    <option value="">All departments / not sure</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground dark:text-foreground-dark">
                    <BookOpen size={16} className="text-accent" />
                    Course or subject
                  </div>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. CT-577 Advanced Theory of Automata"
                    className={fieldClass()}
                  />
                  <p className="mt-1.5 text-xs text-muted dark:text-muted-dark">
                    Course search will become stronger as we map more NED course codes.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-background p-4 text-sm dark:border-line-dark dark:bg-background-dark">
                  <p className="font-semibold text-foreground dark:text-foreground-dark">
                    Current selection
                  </p>
                  <p className="mt-1 text-muted dark:text-muted-dark">
                    {selectedDepartment?.name ?? 'No department selected'} - {subject || 'Course not set'}
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <label className="block cursor-pointer rounded-2xl border border-dashed border-line bg-background p-8 text-center dark:border-line-dark dark:bg-background-dark">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                    <UploadCloud size={26} className="text-accent" />
                  </div>
                  <p className="text-base font-semibold text-foreground dark:text-foreground-dark">
                    {files.length > 0 ? `${files.length} file(s) selected` : 'Choose PDF or images'}
                  </p>
                  <p className="mt-2 text-sm text-muted dark:text-muted-dark">
                    PDF, JPG, JPEG, or PNG. Total selected size: {formatFileSize(totalSize)}.
                  </p>
                </label>

                <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-foreground dark:text-foreground-dark">
                  Every upload is private until an admin approves it. This keeps the papers section
                  useful and clean for students.
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line p-5 dark:border-line-dark">
            <Button
              label={step === 0 ? 'Cancel' : 'Back'}
              variant="ghost"
              onPress={() => (step === 0 ? router.push('/papers') : setStep((current) => current - 1))}
              className="h-11"
            />
            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinue}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-accent/40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-accent/40"
              >
                {submitting ? 'Uploading...' : 'Submit Paper'}
                {!submitting && <ChevronRight size={16} />}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-card p-4 text-sm text-muted dark:border-line-dark dark:bg-card-dark dark:text-muted-dark">
          <ChevronLeft size={16} className="mt-0.5 shrink-0 text-accent" />
          You can go back at any step. Papers only appear publicly after approval.
        </div>
      </div>
    </Screen>
  );
}
