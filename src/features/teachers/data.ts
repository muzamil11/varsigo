// Domain types shared by the Teachers feature's screens and components.
// Real data now comes from src/features/teachers/api.ts (Supabase) — see
// supabase/schema.sql for the underlying tables.

export interface TeacherBreakdown {
  teaching: number;
  grading: number;
  attendance: number;
  helpfulness: number;
}

export interface TeacherListItem {
  id: string;
  name: string;
  department: string | null;
  courses: { id: string; code: string | null; name: string }[];
  verificationStatus: 'admin_verified' | 'suggestion_approved' | 'unverified';
  rating: number | null; // null = no approved reviews yet
  reviewCount: number;
  /** Per-dimension averages — null with no approved reviews yet. Powers the
   *  Teachers screen's "Lenient attendance" / "Fair grading" style filters,
   *  so those don't need a per-teacher fetch to evaluate. */
  breakdown: TeacherBreakdown | null;
}

export type TeacherQualityKey = keyof TeacherBreakdown;

/** Powers both the Teachers screen's quality filter chips and the small
 *  "why this teacher matched" tags on each card — one source of truth for
 *  the label text so they can't drift apart. */
export const TEACHER_QUALITY_TAGS: { key: TeacherQualityKey; label: string }[] = [
  { key: 'attendance', label: 'Lenient attendance' },
  { key: 'grading', label: 'Fair grading' },
  { key: 'teaching', label: 'Great teaching' },
  { key: 'helpfulness', label: 'Approachable' },
];
// Reviews average 1-5; 4+ reads as "students consistently say so", not one
// generous review skewing the picture.
export const TEACHER_QUALITY_THRESHOLD = 4;
// Below this, a single review could make a teacher look lenient/fair/etc.
// by chance — require a bit of a track record before a quality tag applies.
export const MIN_REVIEWS_FOR_QUALITY_TAG = 2;

export interface TeacherReview {
  id: string;
  author: string; // "Anonymous" or the reviewer's name
  course: { id: string; code: string | null; name: string } | null;
  comment: string | null;
  teaching: number;
  grading: number;
  attendance: number;
  helpfulness: number;
  createdAt: string;
}

/** A review's own overall score, averaged only over dimensions it actually
 *  has. `helpfulness` is 0 (never a real value — the DB check constraint
 *  requires 1-5) for reviews submitted before that column existed, so 0
 *  unambiguously means "not rated" and must be excluded rather than dragging
 *  the average down. Single source of truth so every screen that shows a
 *  per-review star score (teacher detail, compare) agrees with it. */
export function reviewOverall(review: TeacherReview): number {
  const scores = [review.teaching, review.grading, review.attendance, review.helpfulness].filter(
    (score) => score > 0,
  );
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';
// A review's own star ratings are a more reliable "how good was it" signal
// than parsing free-text wording (reviews mix English and Roman Urdu slang),
// so sentiment is derived from reviewOverall() rather than keyword matching.
export const SENTIMENT_POSITIVE_THRESHOLD = 4;
export const SENTIMENT_NEGATIVE_THRESHOLD = 2.5;

export function reviewSentiment(overall: number): ReviewSentiment {
  if (overall >= SENTIMENT_POSITIVE_THRESHOLD) return 'positive';
  if (overall < SENTIMENT_NEGATIVE_THRESHOLD) return 'negative';
  return 'neutral';
}

/** Compare Teachers (src/app/teachers/compare.tsx) lets students pick a
 *  handful of teachers to see side by side — capped low enough that bars
 *  for every teacher still fit on one mobile screen without scrolling
 *  becoming unreadable. */
export const MIN_COMPARE_TEACHERS = 2;
export const MAX_COMPARE_TEACHERS = 4;

export interface TeacherDetail extends TeacherListItem {
  reviews: TeacherReview[];
  /** This viewer's own reviews for this teacher that are still awaiting
   *  moderator approval — empty when logged out or once approved. */
  myPendingReviews: TeacherReview[];
}

/** A single approved review surfaced outside its teacher's own page — e.g.
 *  the Home screen's "What students are saying" highlight. */
export interface RecentReview {
  id: string;
  author: string;
  teacherId: string;
  teacherName: string;
  comment: string;
  rating: number;
  createdAt: string;
}
