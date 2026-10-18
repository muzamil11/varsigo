'use client';

import { ChevronDown } from 'lucide-react';
import React from 'react';

import { GRADE_OPTIONS } from './data';

/** Shows the exact grading scale the calculator computes from, so the
 *  numbers it produces are checkable against something real instead of
 *  being a black box. Pulls straight from GRADE_OPTIONS (data.ts) — the
 *  same array the grade dropdown and the GPA math use — so this table can
 *  never show something different from what's actually being calculated. */
export function GradingScaleTable() {
  return (
    <details className="group mt-6 overflow-hidden rounded-2xl border border-line bg-card dark:border-line-dark dark:bg-card-dark">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          See the official grading scale this is based on
        </span>
        <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180 dark:text-muted-dark" />
      </summary>

      <div className="border-t border-line px-5 pb-5 pt-1 dark:border-line-dark">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted dark:border-line-dark dark:text-muted-dark">
                <th className="py-2 pr-3 font-semibold">Grade</th>
                <th className="py-2 pr-3 font-semibold">Grade Point</th>
                <th className="py-2 font-semibold">Marks / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-line-dark">
              {GRADE_OPTIONS.map((option) => (
                <tr key={option.code}>
                  <td className="py-2 pr-3 font-semibold text-foreground dark:text-foreground-dark">
                    {option.code}
                  </td>
                  <td className="py-2 pr-3 text-foreground dark:text-foreground-dark">
                    {option.gradePoint === null ? '—' : option.gradePoint.toFixed(1)}
                  </td>
                  <td className="py-2 text-muted dark:text-muted-dark">
                    {option.note ? `${option.marksRange !== '—' ? `${option.marksRange} — ` : ''}${option.note}` : option.marksRange}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted dark:text-muted-dark">
          Note: IP is awarded for Thesis after completion of one semester. S, U, P, X, I, IP, and
          WU don&apos;t carry grade points, so they&apos;re excluded from the GPA calculation
          above — same as on your official transcript.
        </p>
      </div>
    </details>
  );
}
