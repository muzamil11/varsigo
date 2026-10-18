'use client';

import { Calculator, CheckCircle2, Info, Plus, RotateCcw, Trash2 } from 'lucide-react';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

import { PageShell } from '@/components';
import { trackEvent } from '@/lib/analytics';
import { GradingScaleTable } from './GradingScaleTable';
import {
  calculateCumulativeGpa,
  calculateSemester,
  emptyCourseRow,
  GRADE_OPTIONS,
  type CourseRow,
} from './data';

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-line bg-background px-3 text-sm text-foreground outline-none focus:border-accent dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark';

const STORAGE_KEY = 'nedhub-gpa-calculator-v1';
const SAVE_DEBOUNCE_MS = 400;

interface StoredGpaState {
  courses?: CourseRow[];
  previousCgpa?: string;
  previousCreditHours?: string;
}

function formatGpa(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

export function GpaCalculator() {
  const makeId = useId();
  const [nextRowNumber, setNextRowNumber] = useState(2);
  const [courses, setCourses] = useState<CourseRow[]>([emptyCourseRow(`${makeId}-1`)]);
  const [previousCgpa, setPreviousCgpa] = useState('');
  const [previousCreditHours, setPreviousCreditHours] = useState('');
  const [restoredFromDevice, setRestoredFromDevice] = useState(false);
  const trackedRef = useRef(false);
  const trackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const semester = useMemo(() => calculateSemester(courses), [courses]);

  const cumulative = useMemo(() => {
    const prevCgpa = Number(previousCgpa);
    const prevHours = Number(previousCreditHours);
    if (!previousCgpa || !previousCreditHours) return null;
    if (!Number.isFinite(prevCgpa) || !Number.isFinite(prevHours) || prevHours <= 0) return null;
    return calculateCumulativeGpa(semester.qualityPoints, semester.countedCreditHours, prevCgpa, prevHours);
  }, [semester, previousCgpa, previousCreditHours]);

  // Restore once on mount, before the save effect below can run with (and
  // persist) the blank default state. Private browsing / blocked storage
  // just means we start fresh — never a hard failure.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredGpaState;
      if (Array.isArray(parsed.courses) && parsed.courses.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time restore from localStorage on mount
        setCourses(parsed.courses);
        setNextRowNumber(parsed.courses.length + 1);
        setRestoredFromDevice(true);
      }
      if (typeof parsed.previousCgpa === 'string') setPreviousCgpa(parsed.previousCgpa);
      if (typeof parsed.previousCreditHours === 'string') setPreviousCreditHours(parsed.previousCreditHours);
    } catch {
      // ignore — nothing saved, or storage isn't available
    }
  }, []);

  // Debounced autosave to this browser only — never sent anywhere. Skips
  // its very first run (the initial mount) so it can't overwrite a saved
  // state with the blank default before the restore effect above has had
  // a chance to apply.
  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return undefined;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const state: StoredGpaState = { courses, previousCgpa, previousCreditHours };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore — private browsing / storage full or blocked
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [courses, previousCgpa, previousCreditHours]);

  // Fires once, 600ms after a real GPA first appears — same debounce
  // shape as useSearchTracking, so we don't spam an event per keystroke
  // while someone is still entering their courses.
  useEffect(() => {
    if (trackTimer.current) clearTimeout(trackTimer.current);
    if (semester.gpa === null || trackedRef.current) return undefined;
    trackTimer.current = setTimeout(() => {
      trackedRef.current = true;
      trackEvent('gpa_calculated', { course_count: courses.length });
    }, 600);
    return () => {
      if (trackTimer.current) clearTimeout(trackTimer.current);
    };
  }, [semester.gpa, courses.length]);

  const updateCourse = (id: string, patch: Partial<CourseRow>) => {
    setCourses((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addCourse = () => {
    setCourses((rows) => [...rows, emptyCourseRow(`${makeId}-${nextRowNumber}`)]);
    setNextRowNumber((n) => n + 1);
  };

  const removeCourse = (id: string) => {
    setCourses((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  };

  const resetAll = () => {
    setCourses([emptyCourseRow(`${makeId}-1`)]);
    setNextRowNumber(2);
    setPreviousCgpa('');
    setPreviousCreditHours('');
    setRestoredFromDevice(false);
    trackedRef.current = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <PageShell className="max-w-4xl py-10">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
        <Calculator size={16} />
        GPA &amp; CGPA Calculator
      </div>
      <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark sm:text-4xl">
        GPA Calculator
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted dark:text-muted-dark sm:text-base">
        Enter this semester&apos;s courses to get your semester GPA, then add your current CGPA
        and total credit hours to see your new cumulative CGPA too.
      </p>

      <div className="mt-5 flex gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-accent" />
        <div className="text-sm leading-6 text-foreground dark:text-foreground-dark">
          <p className="font-semibold">What you&apos;ll need</p>
          <p className="mt-1 text-muted dark:text-muted-dark">
            Your result slip, DMC, or ERP portal — each course row there already lists the{' '}
            <strong className="text-foreground dark:text-foreground-dark">credit hours</strong>{' '}
            right next to the grade. Most theory courses are 3 credit hours, labs are usually 1.
            For the cumulative CGPA below, your transcript also shows your{' '}
            <strong className="text-foreground dark:text-foreground-dark">
              Cumulative GPA
            </strong>{' '}
            and{' '}
            <strong className="text-foreground dark:text-foreground-dark">
              Total Credit Hours Earned
            </strong>{' '}
            so far — that&apos;s all this needs, you don&apos;t have to re-enter every past
            semester.
          </p>
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-card dark:border-line-dark dark:bg-card-dark">
        <div className="border-b border-line px-5 py-4 dark:border-line-dark">
          <p className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            This semester&apos;s courses
          </p>
        </div>

        <div className="hidden gap-3 px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark sm:grid sm:grid-cols-[1fr_110px_1fr_40px]">
          <span>Course (optional)</span>
          <span>Credit hrs</span>
          <span>Grade</span>
          <span />
        </div>

        <div className="divide-y divide-line dark:divide-line-dark">
          {courses.map((course, index) => (
            <div key={course.id} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_110px_1fr_40px] sm:items-center">
              <input
                value={course.name}
                onChange={(e) => updateCourse(course.id, { name: e.target.value })}
                placeholder={`Course ${index + 1} (optional)`}
                className={INPUT_CLASS}
              />
              <div>
                <span className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark sm:hidden">
                  Credit hours
                </span>
                <input
                  value={course.creditHours}
                  onChange={(e) => updateCourse(course.id, { creditHours: e.target.value })}
                  inputMode="decimal"
                  placeholder="Credit hrs"
                  aria-label="Credit hours"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark sm:hidden">
                  Grade
                </span>
                <select
                  value={course.grade}
                  onChange={(e) => updateCourse(course.id, { grade: e.target.value })}
                  aria-label="Grade"
                  className={INPUT_CLASS}
                >
                  {GRADE_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeCourse(course.id)}
                disabled={courses.length === 1}
                aria-label="Remove course"
                className="flex h-11 w-11 items-center justify-center justify-self-start rounded-xl border border-line text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 dark:border-line-dark dark:text-muted-dark dark:hover:text-foreground-dark sm:justify-self-center"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 dark:border-line-dark">
          <button
            type="button"
            onClick={addCourse}
            className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-foreground dark:border-line-dark dark:text-foreground-dark"
          >
            <Plus size={16} />
            Add course
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground dark:text-muted-dark dark:hover:text-foreground-dark"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Semester GPA</p>
          <p className="mt-1 text-4xl font-bold text-foreground dark:text-foreground-dark">
            {formatGpa(semester.gpa)}
          </p>
          <p className="mt-2 text-xs text-muted dark:text-muted-dark">
            {semester.countedCreditHours} credit hour{semester.countedCreditHours === 1 ? '' : 's'}{' '}
            counted toward GPA
            {semester.totalCreditHours !== semester.countedCreditHours &&
              ` (${semester.totalCreditHours} total entered)`}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 dark:border-line-dark dark:bg-card-dark">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">
            New Cumulative CGPA
          </p>
          <p className="mt-1 text-4xl font-bold text-foreground dark:text-foreground-dark">
            {formatGpa(cumulative)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              value={previousCgpa}
              onChange={(e) => setPreviousCgpa(e.target.value)}
              inputMode="decimal"
              placeholder="Current CGPA"
              aria-label="Current CGPA"
              className={INPUT_CLASS}
            />
            <input
              value={previousCreditHours}
              onChange={(e) => setPreviousCreditHours(e.target.value)}
              inputMode="decimal"
              placeholder="Credit hrs so far"
              aria-label="Total credit hours so far"
              className={INPUT_CLASS}
            />
          </div>
          <p className="mt-2 text-xs text-muted dark:text-muted-dark">
            From your transcript: &quot;Cumulative GPA&quot; and &quot;Total Credit Hours
            Earned&quot;. Leave blank to see just this semester&apos;s GPA.
          </p>
        </div>
      </section>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted dark:text-muted-dark">
        <CheckCircle2 size={14} className="shrink-0 text-accent" />
        {restoredFromDevice
          ? 'Restored what you entered last time on this device.'
          : 'Autosaved on this device as you type — never sent anywhere, and never tied to your account.'}
      </div>

      <GradingScaleTable />

      <p className="mt-6 text-xs leading-5 text-muted dark:text-muted-dark">
        Based on NED University&apos;s official grading scale. This is an unofficial estimate —
        always confirm against your actual transcript.
      </p>
    </PageShell>
  );
}
