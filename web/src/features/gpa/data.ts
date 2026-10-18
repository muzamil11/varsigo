/** NED University's grading scale (grade -> grade point). Grades with a
 *  `null` gradePoint (S, U, P, X, I, IP, WU) are administrative markers —
 *  thesis/non-credit/incomplete/withdrawal — and are excluded entirely
 *  from GPA math, not just given 0 points. F *is* counted (0 points, but
 *  its credit hours still count against you), matching how F actually
 *  affects GPA everywhere else. */
export interface GradeOption {
  code: string;
  label: string;
  gradePoint: number | null;
  /** Marks range as shown on the official grading scale — '—' for the
   *  administrative markers that aren't marks-based (S/U/P/X/I/IP/WU). */
  marksRange: string;
  /** Short meaning, shown only for the administrative markers in the
   *  on-page reference table (the lettered grades are self-explanatory). */
  note?: string;
}

/** Single source of truth for NED's grading scale — powers both the grade
 *  dropdown and the on-page reference table (GradingScaleTable), so the two
 *  can never drift apart. */
export const GRADE_OPTIONS: GradeOption[] = [
  { code: 'A', label: 'A (88-100)', gradePoint: 4.0, marksRange: '88 – 100' },
  { code: 'A-', label: 'A- (80-87)', gradePoint: 3.7, marksRange: '80 – 87' },
  { code: 'B+', label: 'B+ (75-79)', gradePoint: 3.4, marksRange: '75 – 79' },
  { code: 'B', label: 'B (70-74)', gradePoint: 3.0, marksRange: '70 – 74' },
  { code: 'B-', label: 'B- (67-69)', gradePoint: 2.7, marksRange: '67 – 69' },
  { code: 'C+', label: 'C+ (64-66)', gradePoint: 2.4, marksRange: '64 – 66' },
  { code: 'C', label: 'C (60-63)', gradePoint: 2.0, marksRange: '60 – 63' },
  { code: 'C-', label: 'C- (57-59)', gradePoint: 1.7, marksRange: '57 – 59' },
  { code: 'D+', label: 'D+ (54-56)', gradePoint: 1.4, marksRange: '54 – 56' },
  { code: 'D', label: 'D (50-53)', gradePoint: 1.0, marksRange: '50 – 53' },
  { code: 'F', label: 'F (Below 50) — Fail', gradePoint: 0.0, marksRange: 'Below 50', note: 'Fail' },
  {
    code: 'S',
    label: 'S — Satisfactory (thesis, not counted)',
    gradePoint: null,
    marksRange: '—',
    note: 'Satisfactory (for Thesis)',
  },
  {
    code: 'U',
    label: 'U — Unsatisfactory (thesis, not counted)',
    gradePoint: null,
    marksRange: '—',
    note: 'Unsatisfactory (for Thesis)',
  },
  {
    code: 'P',
    label: 'P — Pass (non-credit, not counted)',
    gradePoint: null,
    marksRange: '50 – 100',
    note: 'Pass in non-credit course',
  },
  { code: 'X', label: 'X — Exempted (not counted)', gradePoint: null, marksRange: '—', note: 'Exempted' },
  { code: 'I', label: 'I — Incomplete (not counted)', gradePoint: null, marksRange: '—', note: 'Incomplete' },
  {
    code: 'IP',
    label: 'IP — In Progress (not counted)',
    gradePoint: null,
    marksRange: '—',
    note: 'In Progress',
  },
  {
    code: 'WU',
    label: 'WU — Unofficial Withdrawal (not counted)',
    gradePoint: null,
    marksRange: '—',
    note: 'Unofficial withdrawal',
  },
];

export function gradePointFor(code: string): number | null {
  return GRADE_OPTIONS.find((g) => g.code === code)?.gradePoint ?? null;
}

export interface CourseRow {
  id: string;
  name: string;
  creditHours: string;
  grade: string;
}

export function emptyCourseRow(id: string): CourseRow {
  return { id, name: '', creditHours: '3', grade: GRADE_OPTIONS[0].code };
}

export interface SemesterResult {
  /** Credit hours across every row with a valid hours value, counted or not. */
  totalCreditHours: number;
  /** Credit hours that actually feed into the GPA (excludes S/U/P/X/I/IP/WU rows). */
  countedCreditHours: number;
  qualityPoints: number;
  gpa: number | null;
}

export function calculateSemester(courses: CourseRow[]): SemesterResult {
  let totalCreditHours = 0;
  let countedCreditHours = 0;
  let qualityPoints = 0;

  for (const course of courses) {
    const hours = Number(course.creditHours);
    if (!Number.isFinite(hours) || hours <= 0) continue;
    totalCreditHours += hours;

    const gradePoint = gradePointFor(course.grade);
    if (gradePoint !== null) {
      countedCreditHours += hours;
      qualityPoints += hours * gradePoint;
    }
  }

  return {
    totalCreditHours,
    countedCreditHours,
    qualityPoints,
    gpa: countedCreditHours > 0 ? qualityPoints / countedCreditHours : null,
  };
}

/** Standard weighted-average CGPA rollup: treats the previous CGPA as if it
 *  were itself `previousCreditHours` worth of quality points, adds this
 *  semester's quality points/hours, and re-divides. */
export function calculateCumulativeGpa(
  semesterQualityPoints: number,
  semesterCreditHours: number,
  previousCgpa: number,
  previousCreditHours: number,
): number | null {
  const totalHours = previousCreditHours + semesterCreditHours;
  if (totalHours <= 0) return null;
  const previousQualityPoints = previousCgpa * previousCreditHours;
  return (previousQualityPoints + semesterQualityPoints) / totalHours;
}
